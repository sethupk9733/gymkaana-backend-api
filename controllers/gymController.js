const Gym = require('../models/Gym');
const { logActivity } = require('./activityController');

exports.getAllGyms = async (req, res) => {
    try {
        let query = {};
        if (req.user) {
            const roles = req.user.roles || [];
            if (roles.includes('admin')) {
                // Admin sees all gyms by default
                if (req.query.ownerId) {
                    query.ownerId = req.query.ownerId;
                }
            } else if (roles.includes('owner') && req.query.managed === 'true') {
                // Owner sees only their own gyms ONLY if specifically requested
                query.ownerId = req.user._id;
            } else {
                // Regular logged-in user (or owner in marketplace) sees only approved/active
                query.status = { $in: ['Approved', 'Active'] };
            }
        } else {
            // Public sees only approved/active
            query.status = { $in: ['Approved', 'Active'] };
        }

        const roles = req.user?.roles || [];
        console.log('Fetching gyms for user:', req.user ? { id: req.user._id, roles: roles } : 'Guest', 'Managed:', req.query.managed);
        const gyms = await Gym.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'gymId',
                    as: 'gymBookings'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'ownerDetails'
                }
            },
            {
                $lookup: {
                    from: 'plans',
                    localField: '_id',
                    foreignField: 'gymId',
                    as: 'gymPlans'
                }
            },
            { $unwind: { path: '$ownerDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    address: 1,
                    location: 1,
                    rating: 1,
                    reviews: 1,
                    status: 1,
                    description: 1,
                    phone: 1,
                    email: 1,
                    timings: 1,
                    images: 1,
                    members: 1,
                    checkins: 1,
                    facilities: 1,
                    specializations: 1,
                    trainers: 1,
                    trainerDetails: 1,
                    houseRules: 1,
                    documentation: 1,
                    bankDetails: 1,
                    baseDayPassPrice: 1,
                    createdAt: 1,
                    ownerId: {
                        _id: '$ownerDetails._id',
                        name: '$ownerDetails.name',
                        email: '$ownerDetails.email',
                        phoneNumber: '$ownerDetails.phoneNumber'
                    },
                    revenues: {
                        $concat: [
                            "₹",
                            {
                                $toString: {
                                    $sum: {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: '$gymBookings',
                                                    as: 'b',
                                                    cond: { $in: ['$$b.status', ['active', 'completed', 'upcoming']] }
                                                }
                                            },
                                            as: 'fb',
                                            in: '$$fb.amount'
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    liveFootfall: {
                        $size: {
                            $filter: {
                                input: '$gymBookings',
                                as: 'b',
                                cond: { $in: ['$$b.status', ['active', 'completed', 'upcoming']] }
                            }
                        }
                    },
                    bestDiscount: {
                        $max: {
                            $map: {
                                input: '$gymPlans',
                                as: 'plan',
                                in: { $ifNull: ['$$plan.discount', 0] }
                            }
                        }
                    },
                    maxBaseDiscount: {
                        $max: {
                            $map: {
                                input: '$gymPlans',
                                as: 'plan',
                                in: { $ifNull: ['$$plan.baseDiscount', 0] }
                            }
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        console.log(`Found ${gyms.length} gyms for query:`, JSON.stringify(query));
        console.log('DEBUG First Gym:', gyms[0]?.name, { maxBaseDiscount: gyms[0]?.maxBaseDiscount, bestDiscount: gyms[0]?.bestDiscount });
        res.json(gyms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createGym = async (req, res) => {
    try {
        const { plans, ...gymData } = req.body;

        const gym = new Gym({
            ...gymData,
            ownerId: req.user._id
        });

        const newGym = await gym.save();

        // If plans were provided, create them
        if (plans && Array.isArray(plans)) {
            const Plan = require('../models/Plan');
            const plansToCreate = plans.map(plan => ({
                ...plan,
                gymId: newGym._id
            }));
            await Plan.insertMany(plansToCreate);
        }

        await logActivity({
            userId: req.user._id,
            gymId: newGym._id,
            action: 'Gym Registered',
            description: `New hub "${newGym.name}" awaiting clearance.`,
            type: 'warning'
        });

        res.status(201).json(newGym);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getGymById = async (req, res) => {
    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        // Fetch real-time stats from bookings
        const revenueResult = await require('../models/Booking').aggregate([
            { $match: { gymId: gym._id, status: { $in: ['active', 'completed', 'upcoming'] } } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);

        const gymObj = gym.toObject();
        gymObj.realRevenue = revenueResult[0]?.total || 0;
        gymObj.realBookings = revenueResult[0]?.count || 0;

        res.json(gymObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGym = async (req, res) => {
    try {
        const roles = req.user.roles || [];
        const gym = await Gym.findById(req.params.id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        // Security check: Only owner or admin
        if (!roles.includes('admin') && gym.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this gym' });
        }

        // Apply updates
        Object.assign(gym, req.body);
        const updatedGym = await gym.save();

        // If baseDayPassPrice changed, recalculate all plan discounts for this gym
        if (req.body.baseDayPassPrice !== undefined) {
            const Plan = require('../models/Plan');
            const plans = await Plan.find({ gymId: updatedGym._id });
            const newBasePrice = Number(req.body.baseDayPassPrice);

            for (const plan of plans) {
                const totalDayValue = newBasePrice * (plan.sessions || 1);
                if (totalDayValue > 0) {
                    const calculatedDiscount = Math.round((1 - (plan.price / totalDayValue)) * 100);
                    plan.baseDiscount = Math.max(0, calculatedDiscount);
                    await plan.save();
                }
            }
        }

        res.json(updatedGym);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteGym = async (req, res) => {
    try {
        const roles = req.user.roles || [];
        const gym = await Gym.findById(req.params.id);
        if (!gym) return res.status(404).json({ message: 'Gym not found' });

        // Security check
        if (!roles.includes('admin') && gym.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this gym' });
        }

        await Gym.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gym deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
