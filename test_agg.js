const mongoose = require('mongoose');
const Gym = require('./models/Gym');
const Plan = require('./models/Plan');

async function testAggregation() {
    try {
        await mongoose.connect('mongodb://localhost:27017/gymkaana');

        const gym = await Gym.findOne({ name: /fat/i });
        const query = { _id: gym._id };

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
                    },
                    gymPlansCount: { $size: '$gymPlans' }
                }
            }
        ]);

        console.log('Aggregation result:', JSON.stringify(gyms, null, 2));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testAggregation();
