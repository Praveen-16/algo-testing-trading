const User = require('../models/User');
let user5CeState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0
};

let user5PeState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0
};

let lotSize = 75;
let buyAmount = 0;
let cachedUser = null;
let isSaving = false;
let isTradeHandlerActive = false;
let doTrade = true;
const MAX_VALUES_LENGTH = 300;
const INCREASE_PERCENTAGE = 1.25;
const STOP_LOSE =  0.92;
const TARGET =  1.07; 
const tradeLocks = { CE: false, PE: false }; 

const formatDateTime = (date) => {
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  };
  return date.toLocaleString('en-GB', options);
};

const fetchUser = async (userName, refresh = false) => {
  if (!cachedUser || refresh) {
    cachedUser = await User.findOne({ name: userName });
    if (!cachedUser) {
      console.error('User not found');
      return null;
    }
  }
  return cachedUser;
};

const createSampleUser = async () => {
  try {
    const sampleUser = new User({
      name: 'day1009',
      capital: 20000,
      availableBalance: 20000,
      netProfitOrLoss: 0,
      totalTrades: 0,
      trades: [],
      peValues: [],
      ceValues: []
    });
    await sampleUser.save();
    console.log('Sample user added to the database:', sampleUser);
  } catch (error) {
    console.error('Error adding sample user:', error);
  }
};
// createSampleUser()

const updateUser = async (attempts = 3) => {
  if (cachedUser && !isSaving) {
    isSaving = true;
    try {
      await User.findOneAndUpdate(
        { _id: cachedUser._id },
        cachedUser.toObject(),
        { new: true, maxTimeMS: 5000 }
      );
    } catch (error) {
      if (attempts > 1 && error.code === 'ECONNRESET') {
        await updateUser(attempts - 1);
      } else {
        console.error("Error during save user5:", error);
      }
    } finally {
      isSaving = false;
    }
  }
};


const acquireLock = (optionType) => {
  if (!tradeLocks[optionType]) {
    tradeLocks[optionType] = true;
    return true;
  }
  return false;
};

const releaseLock = (optionType) => {
  tradeLocks[optionType] = false;
};


const tradeHandler = async (ltp, userName, optionType) => {
  if (!acquireLock(optionType)) {
    return; 
  }

  try {
    let user = await fetchUser(userName);
    if (!user) return;

    let state = optionType === 'CE' ? user5CeState : user5PeState;
    let valueArray = optionType === 'CE' ? user.ceValues : user.peValues;

    if (!user.doTrade && state.position === 0) {
      return; 
    }

   
    valueArray.push({
      value: ltp,
      time: new Date(),
    });
    if (valueArray.length > 5) valueArray.shift();

    state.previousPrices.push(ltp);
    if (state.previousPrices.length === MAX_VALUES_LENGTH) {
      state.previousPrices.shift();
    }

    const currentPrice = ltp;
    const isPriceIncreased = state.previousPrices.some((price) => currentPrice >= price * INCREASE_PERCENTAGE);

    
    if (
      isPriceIncreased &&
      user.doTrade &&
      user.availableBalance >= currentPrice * lotSize &&
      user5CeState.position === 0 &&
      user5PeState.position === 0 &&
      currentPrice > 10
    ) {
      const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
      state.position += maxLots;
      const buyAmount = maxLots * currentPrice * lotSize;
      user.availableBalance -= buyAmount - 50;
      state.buyPrice = currentPrice;
      state.stopLoss = state.buyPrice * STOP_LOSE;
      state.profitTarget = state.buyPrice * TARGET;
      user.totalTrades++;
      user.todayTradesCount++;

      const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(2)}, Units: ${state.position.toFixed(2)}, Amount: ${buyAmount.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
      user.trades.push(tradeStatement);
    }

  
    if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {
      const exitPrice = currentPrice;
      const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
      const principal = state.buyPrice * state.position * lotSize;

      if (profit > 0) {
        user.availableBalance += principal - 50;
        user.unsettledFunds += profit;
        user.totalPositiveTrades += 1;
        user.todayPositiveTrades += 1;
      } else {
        user.availableBalance += exitPrice * state.position * lotSize - 50;
        user.totalNegativeTrades += 1;
        user.todayNegativeTrades += 1;
      }

      user.netProfitOrLoss += profit;
      const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
      user.trades.push(tradeStatement);

      state.previousPrices.length = 0;
      state.position = 0;
    }

    await updateUser();
  
    if (user.todayNegativeTrades > 2) {
      user.doTrade = false;
      console.log(`User ${userName} lost 3 trades today. Stopping trading.`);
    } else if (user.todayPositiveTrades > 2) {
      user.doTrade = false;
      console.log(`User ${userName} won 3 trades today. Stopping trading.`);
    }

  } catch (error) {
    console.error(`Error in tradeHandler for ${optionType}:`, error);
  } finally {
    releaseLock(optionType);
  }
};


const user5CE = async (ltp, userName) => {
  await tradeHandler(ltp, userName, 'CE');
};

const user5PE = async (ltp, userName) => {
  await tradeHandler(ltp, userName, 'PE');
};

const clearValues5 = () => {
  user5CeState.previousPrices = [];
  user5PeState.previousPrices = [];
  user5CeState.position = 0;
  user5PeState.position = 0;
  isTradeHandlerActive = false;
  cachedUser=null
};

module.exports = { user5CE, user5PE, createSampleUser, clearValues5,user5PeState, user5CeState  };
