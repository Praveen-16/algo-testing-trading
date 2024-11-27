const User = require('../models/User');

let ceState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0
};

let peState = {
  previousPrices: [],
  position: 0,
  buyPrice: 0,
  stopLoss: 0,
  profitTarget: 0
};

let lotSize = 25;
let buyAmount = 0;
let cachedUser = null;
let isTradHandler = false;
let doTrade = true;

const MAX_VALUES_LENGTH = 900;
const INCREASE_PERCENTAGE = 1.4;
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
        console.error("Error during save user10:", error);
      }
    } finally {
      isSaving = false;
    }
  }
};



const tradeHandler = async (ltp, userName, optionType) => {
  let user = await fetchUser(userName);
  if(user.todayNegativeTrades == 0 || user.todayNegativeTrades == 1 ){
    user.doTrade = true;
  }
  if (user.todayNegativeTrades > 1) {
    user.doTrade = false;
    console.log("user lost 2 trades this today, we are closing", user.name)
  }
  if (user.todayPositiveTrades > 1) {
    user.doTrade = false;
    console.log("user won 2 trades this today, we are closing", user.name)
  }
  if (!user.doTrade) {
    return;
  }
  if(!isTradHandler){
    isTradHandler = true
  }
  if (!user) return;


  let state = optionType === 'CE' ? ceState : peState;
  let valueArray = optionType === 'CE' ? user.ceValues : user.peValues;

  state.previousPrices.push(ltp);
  valueArray.push({
    value: ltp,
    time: new Date()  
  });  
  if (state.previousPrices.length === MAX_VALUES_LENGTH) state.previousPrices.shift();

  if (valueArray.length > 5) {
    valueArray.shift();  
  }


  const currentPrice = ltp;
  const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * INCREASE_PERCENTAGE);


  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize && state.position == 0 && currentPrice > 10) {
    // console.log( "check prices: ",state.previousPrices)

    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    state.position += maxLots;
    buyAmount = (maxLots * currentPrice * lotSize);
    user.availableBalance -= (maxLots * currentPrice * lotSize) - 50;
    state.buyPrice = currentPrice;
    state.stopLoss = state.buyPrice * STOP_LOSE;
    state.profitTarget = state.buyPrice * TARGET;
    user.totalTrades++;
    user.todayTradesCount++;

    const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(2)}, Units: ${state.position.toFixed(2)}, Amount: ${buyAmount.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement );

  }


  if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {

    const exitPrice = currentPrice;
    const principal = state.buyPrice * state.position * lotSize;
    const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
    if (profit > 0) {
      user.availableBalance += principal - 50; 
      user.unsettledFunds += profit;  
      user.totalPositiveTrades += 1;
      user.todayPositiveTrades +=1
    } else {
      user.availableBalance += (exitPrice * state.position * lotSize) - 50;
      user.totalNegativeTrades += 1;
      user.todayNegativeTrades +=1;
    }

    user.netProfitOrLoss +=(profit);
    const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement );
    
    state.previousPrices.length = 0;  
    state.position = 0;
    isTradHandler = false;
  }

  await updateUser();
};


const user10CE = async (ltp, userName) => {

  await tradeHandler(ltp, userName, 'CE');
};


const user10PE = async (ltp, userName) => {

  await tradeHandler(ltp, userName, 'PE');
};

const clearValues10 = ()=>{
  ceState.previousPrices =[];
  peState.previousPrices = [];
  isTradHandler = false;
  cachedUser = null;
}

module.exports = { user10CE, user10PE, clearValues10 };
