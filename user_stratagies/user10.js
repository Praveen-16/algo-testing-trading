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


const formatDateTime = (date) => {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
const updateUser = async () => {
  if (cachedUser && !isSaving) {
    isSaving = true;  
    try {
      await cachedUser.save();  
    } catch (error) {
      console.error('Error during save:', error);
    } finally {
      isSaving = false;  
    }
  }
};


const tradeHandler = async (ltp, userName, optionType) => {
  if(!isTradHandler){
    console.log("Tradhandler started for user ",userName,", LTP: ", ltp);
    isTradHandler = true
  }
  let user = await fetchUser(userName);
  if (!user) return;


  let state = optionType === 'CE' ? ceState : peState;
  let valueArray = optionType === 'CE' ? user.ceValues : user.peValues;

  state.previousPrices.push(ltp);
  valueArray.push({
    value: ltp,
    time: new Date()  
  });  
  if (state.previousPrices.length === 900) state.previousPrices.shift();

  if (valueArray.length > 6) {
    valueArray.shift();  
  }


  const currentPrice = ltp;
  const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * 1.4);


  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize && state.position == 0) {

    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    state.position += maxLots;
    buyAmount = (maxLots * currentPrice * lotSize);
    user.availableBalance -= (maxLots * currentPrice * lotSize) - 50;
    state.buyPrice = currentPrice;
    state.stopLoss = state.buyPrice * 0.9;
    state.profitTarget = state.buyPrice * 1.06;
    user.totalTrades++;

    const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(2)}, Units: ${state.position.toFixed(2)}, Amount: ${buyAmount.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement );

    console.log(tradeStatement);
  }


  if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {

    const exitPrice = currentPrice;
    const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
    state.previousPrices.length = 0;  
    user.availableBalance +=  (exitPrice * state.position * lotSize ) - 50;
    user.netProfitOrLoss +=(profit);
    const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement );

    console.log(tradeStatement);
    state.position = 0;
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
}

module.exports = { user10CE, user10PE, clearValues10 };
