const User = require('../models/User');

let day1009CeState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0,
  previousLTP:0,
  minPrice:0
};

let day1009PeState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0,
  previousLTP:0,
  minPrice:0
};

let lotSize = 75;
let buyAmount = 0;
let cachedUser = null;
let isTradHandler = false;
let doTrade = true;

// const MAX_VALUES_LENGTH = 900;
const INCREASE_PERCENTAGE = 2;
const STOP_LOSE =  0.95;
const TARGET =  1.1; 



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

const fetchUser = async (userName) => {
  if (!cachedUser) {
    cachedUser = await User.findOne({ name: userName });
    if (!cachedUser) {
      console.error('User not found');
      return null;
    }
  }
  return cachedUser;
};

let isSaving = false;
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
        console.error("Error during save user day1009: ", error);
      }
    } finally {
      isSaving = false;
    }
  }
};


const tradeHandler = async (ltp, userName, optionType) => {
  let user = await fetchUser(userName);
  if (!user.doTrade || !user) return;
  if (user.todayNegativeTrades <= 1) {
    user.doTrade = true;
  } else {
    user.doTrade = false;
    console.log("user reached trading limit for today ", user.name);
  }
 

  let state = optionType === "CE" ? day1009CeState : day1009PeState;
  let valueArray = optionType === "CE" ? user.ceValues : user.peValues;

  if (!state.minPrice || ltp < state.minPrice) {
    state.minPrice = ltp;
  }
  let currentPrice = ltp;

  const isPriceIncreased = ltp >= state.minPrice * INCREASE_PERCENTAGE;

  valueArray.push({ value: ltp, time: new Date() });
  if (valueArray.length > 5) valueArray.shift();

  if (
    isPriceIncreased &&
    user.availableBalance >= ltp * lotSize &&
    state.position === 0 && currentPrice > 10
  ) {
    const maxLots = Math.floor(user.availableBalance / (ltp * lotSize));
    state.position += maxLots;
    buyAmount = maxLots * ltp * lotSize;
    user.availableBalance -= buyAmount - 50;
    state.buyPrice = ltp;
    state.stopLoss = state.buyPrice * STOP_LOSE;
    state.profitTarget = state.buyPrice * TARGET;
    user.totalTrades++;
    user.todayTradesCount++;

    const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(
      2
    )}, Units: ${state.position.toFixed(2)}, Amount: ${buyAmount.toFixed(
      2
    )}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(
      new Date()
    )}`;
    user.trades.push(tradeStatement);
  }

  if (
    state.position > 0 &&
    (ltp <= state.stopLoss || ltp >= state.profitTarget)
  ) {
    const exitPrice = ltp;
    const principal = state.buyPrice * state.position * lotSize;
    const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
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
    const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(
      2
    )}, Profit/Loss: ${profit.toFixed(
      2
    )}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(
      new Date()
    )}`;
    user.trades.push(tradeStatement);

    state.minPrice = null;
    state.position = 0;
    isTradHandler = false;
  }

  await updateUser();
};



const day1009CE = async (ltp, userName) => {

  await tradeHandler(ltp, userName, 'CE');
};


const day1009PE = async (ltp, userName) => {

  await tradeHandler(ltp, userName, 'PE');
};

const clearValuesday1009 = ()=>{
  day1009CeState.previousPrices =[];
  day1009PeState.previousPrices = [];
  day1009CeState.position = 0;
  day1009PeState.position = 0;
  isTradHandler = false;
  cachedUser = null;
}

module.exports = { day1009CE, day1009PE, clearValuesday1009, day1009PeState, day1009CeState };

