const User = require('../models/User');

// Separate objects to track state for CE and PE
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
let cachedUser = null;



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

let isSaving = false;  // Flag to prevent parallel saves
const updateUser = async () => {
  if (cachedUser && !isSaving) {
    isSaving = true;  // Set flag to true to prevent parallel saves
    try {
      await cachedUser.save();  // Save the document
    } catch (error) {
      console.error('Error during save:', error);
    } finally {
      isSaving = false;  // Reset flag after save completes
    }
  }
};


const tradeHandler = async (ltp, userName, optionType) => {

  let user = await fetchUser(userName);
  if (!user) return;


  let state = optionType === 'CE' ? ceState : peState;

  state.previousPrices.push(ltp);
  if (state.previousPrices.length === 900) state.previousPrices.shift();

  const currentPrice = ltp;
  const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * 1.4);


  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize) {

    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    state.position += maxLots;
    user.availableBalance -= (maxLots * currentPrice * lotSize) - 50;
    state.buyPrice = currentPrice;
    state.stopLoss = state.buyPrice * 0.9;
    state.profitTarget = state.buyPrice * 1.06;
    user.totalTrades++;

    const tradeStatement = `Bought ${optionType} at ${state.buyPrice}, SL: ${state.stopLoss}, Target: ${state.profitTarget} (Date: ${formatDateTime(new Date())})`;
    user.trades.push(tradeStatement );

    console.log(tradeStatement);
  }


  if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {

    const exitPrice = currentPrice;
    const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
    state.previousPrices.length = 0;  
    user.availableBalance += (profit - 50);
    user.netProfitOrLoss = user.availableBalance - user.capital;

    const tradeStatement = `Sold ${optionType} at ${exitPrice}, Profit/Loss: ${profit} (Date: ${formatDateTime(new Date())})`;
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

module.exports = { user10CE, user10PE };
