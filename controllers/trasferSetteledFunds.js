const cron = require('node-cron');
const User = require('../models/User'); 

cron.schedule('10 9 * * *', async () => {
  try {
    const users = await User.find();
    for (const user of users) {
      if (user.unsettledFunds > 0) {
        user.availableBalance += user.unsettledFunds;
        user.unsettledFunds = 0;
      }
      user.todayTradesCount = 0;
      user.todayPositiveTrades = 0;
      user.todayNegativeTrades = 0;
      user.doTrade = true;
      await user.save();
      console.log(`Updated daily stats and transferred unsettled funds for user ${user.name}`);
    }
    console.log('Daily unsettled funds transfer, trade count reset, and doTrade flag update completed.');
  } catch (error) {
    console.error('Error in daily unsettled funds transfer, reset, and doTrade update:', error);
  }
}, {
  timezone: "Asia/Kolkata" 
});
