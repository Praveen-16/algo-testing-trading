const cron = require('node-cron');
const User = require('../models/User'); 

cron.schedule('0 9 * * *', async () => {
  try {
    const users = await User.find();

    for (const user of users) {
      if (user.unsettledFunds > 0) {
        user.availableBalance += user.unsettledFunds;
        user.unsettledFunds = 0;
        await user.save();
        console.log(`Transferred unsettled funds for user ${user.name}`);
      }
    }
    console.log('Daily unsettled funds transfer completed.');
  } catch (error) {
    console.error('Error in daily unsettled funds transfer:', error);
  }
});

module.exports = cron;
