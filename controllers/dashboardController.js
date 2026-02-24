const Gym = require('../models/Gym');
const Booking = require('../models/Booking');

exports.getStats = async (req, res) => {
    try {
        const roles = req.user.roles || [];
        console.log('🔐 User Roles:', roles, '| User ID:', req.user._id, '| User Name:', req.user.name);

        if (roles.includes('owner') && !roles.includes('admin')) {
            const { gymId } = req.query;
            console.log('📊 OWNER DASHBOARD - Owner:', req.user.name, '| GymId Filter:', gymId);

            let query = { ownerId: req.user._id };
            if (gymId && gymId !== 'all') query._id = gymId;

            const myGyms = await Gym.find(query);
            const gymIds = myGyms.map(g => g._id);
            console.log('🏢 Found Gyms:', myGyms.map(g => ({ id: g._id, name: g.name })));

            const totalMembersCount = await Booking.distinct('userId', {
                gymId: { $in: gymIds },
                status: { $in: ['active', 'upcoming', 'completed'] }
            });

            const totalBookingCount = await Booking.countDocuments({
                gymId: { $in: gymIds },
                status: { $in: ['active', 'completed', 'upcoming'] }
            });

            const totalRevenueResult = await Booking.aggregate([
                { $match: { gymId: { $in: gymIds }, status: { $in: ['active', 'completed', 'upcoming'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const gymPerformance = await Gym.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'bookings',
                        localField: '_id',
                        foreignField: 'gymId',
                        pipeline: [
                            { $match: { status: { $in: ['active', 'completed', 'upcoming'] } } }
                        ],
                        as: 'gymBookings'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        status: 1,
                        revenue: { $sum: "$gymBookings.amount" },
                        bookingCount: { $size: "$gymBookings" },
                        members: {
                            $size: {
                                $setUnion: ["$gymBookings.userId", []]
                            }
                        }
                    }
                },
                { $sort: { revenue: -1 } }
            ]);

            // Real check-ins today for owner's gyms
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const checkInsTodayCount = await require('../models/Activity').countDocuments({
                gymId: { $in: gymIds },
                action: { $regex: /Check-in/i },
                createdAt: { $gte: startOfDay }
            });

            // Trends for owner
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const lastMonthRevenue = await Booking.aggregate([
                { $match: { gymId: { $in: gymIds }, createdAt: { $lt: lastMonth }, status: { $in: ['active', 'completed', 'upcoming'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const oldRev = lastMonthRevenue[0]?.total || 0;
            const totalRevenue = totalRevenueResult[0]?.total || 0;
            const revenueTrend = oldRev > 0 ? `+${(((totalRevenue - oldRev) / oldRev) * 100).toFixed(1)}%` : '+0%';

            const averageRating = myGyms.length > 0
                ? (myGyms.reduce((acc, curr) => acc + (curr.rating || 0), 0) / myGyms.length).toFixed(1)
                : "0.0";

            return res.json({
                totalMembers: totalMembersCount.length,
                activeMembers: totalMembersCount.length,
                totalRevenue,
                totalBookingCount, // Added
                averageRating, // Added
                revenueTrend,
                dailyCheckins: checkInsTodayCount,
                checkInsToday: checkInsTodayCount,
                gymPerformance
            });
        }

        // Admin Stats (Global or Per-Owner) - shows ALL gyms from ALL owners
        console.log('📊 ADMIN DASHBOARD - fetching ALL gyms data');
        const { ownerId } = req.query;
        let gymQuery = {};
        let bookingQuery = { status: { $in: ['active', 'completed', 'upcoming'] } };

        if (ownerId && ownerId !== 'all') {
            console.log('📊 Admin filtering by owner ID:', ownerId);
            gymQuery.ownerId = ownerId;
            const gyms = await Gym.find({ ownerId });
            bookingQuery.gymId = { $in: gyms.map(g => g._id) };
        } else {
            console.log('📊 Admin viewing ALL owners - no filter');
        }

        const totalGyms = await Gym.countDocuments(gymQuery);
        const pendingOnboarding = await Gym.countDocuments({ ...gymQuery, status: 'Pending' });
        const totalOwners = await require('../models/User').countDocuments({ roles: { $in: ['owner'] } });

        const totalMembersResult = await Gym.aggregate([
            { $match: gymQuery },
            { $group: { _id: null, total: { $sum: "$members" } } }
        ]);

        const activeUsersCount = await Booking.distinct('userId', {
            ...bookingQuery,
            status: { $in: ['active', 'upcoming', 'completed'] }
        });

        const totalRevenueResult = await Booking.aggregate([
            { $match: bookingQuery },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;

        console.log('💰 Total Revenue:', totalRevenue, '| Active Users:', activeUsersCount.length, '| Total Gyms:', totalGyms);

        // Gym Performance - ALL gyms
        const gymPerformance = await Gym.aggregate([
            { $match: gymQuery },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'gymId',
                    as: 'gymBookings'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    members: 1,
                    status: 1,
                    revenue: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$gymBookings',
                                        as: 'b',
                                        cond: { $in: ['$$b.status', ['active', 'completed', 'upcoming']] }
                                    }
                                },
                                as: 'filtered',
                                in: '$$filtered.amount'
                            }
                        }
                    },
                    bookingCount: {
                        $size: {
                            $filter: {
                                input: '$gymBookings',
                                as: 'b',
                                cond: { $in: ['$$b.status', ['active', 'completed', 'upcoming']] }
                            }
                        }
                    }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // Owner Performance - How much each owner is bringing in
        const ownerPerformance = await require('../models/User').aggregate([
            { $match: { roles: { $in: ['owner'] } } },
            {
                $lookup: {
                    from: 'gyms',
                    localField: '_id',
                    foreignField: 'ownerId',
                    as: 'ownerGyms'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    gymCount: { $size: '$ownerGyms' },
                    gyms: '$ownerGyms.name'
                }
            },
            { $sort: { gymCount: -1 } }
        ]);

        // Market Analytics - Regional Distribution (Mock or real if locations exist)
        // For now, let's get some real data counts
        const totalBookingCount = await Booking.countDocuments(bookingQuery);

        // Calculate real check-ins today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const checkInsTodayCount = await require('../models/Activity').countDocuments({
            action: { $regex: /Check-in/i },
            createdAt: { $gte: startOfDay }
        });

        // Calculate trends (comparing to total)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthRevenue = await Booking.aggregate([
            { $match: { createdAt: { $lt: lastMonth }, status: { $in: ['active', 'completed', 'upcoming'] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const oldRev = lastMonthRevenue[0]?.total || 0;
        const revenueTrend = oldRev > 0 ? `+${(((totalRevenue - oldRev) / oldRev) * 100).toFixed(1)}%` : '+0%';

        // Categorize gyms into tiers
        const tiers = {
            premium: gymPerformance.filter(g => g.revenue > 100000).length,
            active: gymPerformance.filter(g => g.revenue > 50000 && g.revenue <= 100000).length,
            boutique: gymPerformance.filter(g => g.revenue > 10000 && g.revenue <= 50000).length,
            value: gymPerformance.filter(g => g.revenue <= 10000).length
        };

        res.json({
            activeMembers: activeUsersCount.length,
            totalRevenue,
            platformIncome: totalRevenue * 0.15,
            checkInsToday: checkInsTodayCount,
            revenueTrend,
            totalGyms,
            totalOwners,
            totalBookingCount,
            pendingOnboarding,
            gymPerformance,
            ownerPerformance,
            tiers,
            research: {
                regionalDominance: totalGyms > 0 ? "84%" : "0%", // Placeholder for now but exposed
                orderSurge: revenueTrend,
                churnResistance: activeUsersCount.length > 50 ? "High" : "Solid"
            }
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicStats = async (req, res) => {
    try {
        const totalGyms = await Gym.countDocuments();

        const activeMembersCount = await Booking.distinct('userId', {
            status: { $in: ['active', 'upcoming', 'completed'] }
        });
        const locations = await Gym.distinct('location');
        const citiesCount = locations.filter(l => l && l.trim() !== "").length;

        const latestReviews = await require('../models/Review').find()
            .populate('gymId', 'name')
            .populate('userId', 'name')
            .sort({ rating: -1, createdAt: -1 })
            .limit(3);

        const reviews = latestReviews.map(r => ({
            text: r.comment,
            author: r.userId?.name || "Anonymous",
            role: r.gymId?.name || "Fitness Enthusiast",
            rating: r.rating
        }));

        res.json({
            totalGyms: totalGyms > 0 ? `${totalGyms}+` : "10+",
            activeMembers: activeMembersCount.length > 50 ? `${(activeMembersCount.length / 1000).toFixed(1)}k` : `${activeMembersCount.length || 0}+`,
            citiesCovered: citiesCount > 0 ? `${citiesCount}+` : "5+",
            platformRating: "4.9", // Or calculate average of all gym ratings
            recentReviews: reviews.length > 0 ? reviews : null
        });
    } catch (err) {
        console.error('Public stats error:', err);
        res.status(500).json({ message: err.message });
    }
};
