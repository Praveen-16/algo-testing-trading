const axios = require('axios');
const cron = require('node-cron');
const User = require('../models/User'); 
const { BASE_URL } = require('../config/baseURL')
const { stopTrading, startTrading, getNifty50Value, getBankNiftyValue } = require('../controllers/tradingController')

cron.schedule('10 9 * * *', async () => {
  try {
  const response =  await axios.post(`${BASE_URL}/stop-websocket`);
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
    }
    console.log('Daily unsettled funds transfer, trade count reset, and doTrade flag update completed.');
  } catch (error) {
    console.error('Error in daily unsettled funds transfer, reset, and doTrade update:', error);
  }
}, {
  timezone: "Asia/Kolkata" 
});

cron.schedule('13 9 * * *', async () => {
  try {
    await axios.get(`${BASE_URL}/nifty50data`);
    console.log('Nifty50 value fetched successfully.');

    await axios.get(`${BASE_URL}/bankniftydata`);
    console.log('Bank Nifty value fetched successfully.');

    await axios.post(`${BASE_URL}/starttrading`);
    console.log('Trading started successfully.');
  } catch (error) {
    console.error('Error in triggering APIs at 9:13 AM:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});
