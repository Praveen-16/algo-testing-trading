
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
let isSaving = false;  
let isTradHandler = false;

// Function to create a sample user
const createSampleUser = async () => {
  try {
    const sampleUser = new User({
      name: 'user5',
      capital: 20000,
      availableBalance: 20000,
      netProfitOrLoss: 0,
      totalTrades: 0,
      trades: []
    });
    await sampleUser.save();
    console.log('Sample user added to the database:', sampleUser);
  } catch (error) {
    console.error('Error adding sample user:', error);
  }
};

// Function to format date and time
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

// Function to fetch user details from the database
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

// Function to update user details in the database
const updateUser = async () => {
  if (cachedUser && !isSaving) {
    isSaving = true;  // Set flag to true to prevent parallel saves
    try {
      // console.log("Starting save", cachedUser);
      await cachedUser.save();
    } catch (error) {
      console.error('Error during save:', error);
    } finally {
      isSaving = false;  // Reset flag after save completes
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

  // Choose the correct state based on option type (CE or PE)
  let state = optionType === 'CE' ? ceState : peState;

  state.previousPrices.push(ltp);
  if (state.previousPrices.length === 300) state.previousPrices.shift();

  const currentPrice = ltp;
  const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * 1.1);

  // ** Buy Logic **
  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize) {
    // Buy operation (use available balance correctly)
    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    state.position += maxLots;
    let buyAmount = (maxLots * currentPrice * lotSize);
    user.availableBalance -= buyAmount - 50;
    state.buyPrice = currentPrice;
    state.stopLoss = state.buyPrice * 0.9;
    state.profitTarget = state.buyPrice * 1.1;
    user.totalTrades++;

    const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(2)}, Units: ${state.position.toFixed(2)}, Amount spent: ${buyAmount.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, Time: ${formatDateTime(new Date())})`;
    user.trades.push(tradeStatement);

    console.log(tradeStatement);
  }

  // ** Sell Logic **
  if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {
    // Sell operation
    const exitPrice = currentPrice;
    const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
    state.previousPrices.length = 0;  
    user.availableBalance += profit > 0 ? (exitPrice * state.position * lotSize - 50) : -50;
    user.netProfitOrLoss = user.availableBalance - user.capital;

    const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, Time: ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement);

    console.log(tradeStatement);
    state.position = 0;
  }


  await updateUser();
};

// Wrapper function for CE trading
const user5CE = async (ltp, userName) => {
  ceState = {
    previousPrices: [],
    position: 0,
    buyPrice: 0,
    stopLoss: 0,
    profitTarget: 0
  };
  await tradeHandler(ltp, userName, 'CE');
};

// Wrapper function for PE trading
const user5PE = async (ltp, userName) => {
  peState = {
    previousPrices: [],
    position: 0,
    buyPrice: 0,
    stopLoss: 0,
    profitTarget: 0
  };
  await tradeHandler(ltp, userName, 'PE');
};

module.exports = { user5CE, user5PE, createSampleUser };
