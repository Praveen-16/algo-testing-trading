const User = require('../models/User');  
let previousPrices = [];
let lotSize = 25;
let position = 0;
let buyPrice = 0;
let stopLoss = 0;
let profitTarget = 0;

let cachedUser = null;

// Function to create a sample user
const createSampleUser = async () => {
  try {
    const sampleUser = new User({
      name: 'user10',
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
// createSampleUser();

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

const updateUser = async () => {
  if (cachedUser) {
    await cachedUser.save();
  }
};

const tradeStrategy = async (ltp, userName) => {
  let user = await fetchUser(userName);
  if (!user) return;

  previousPrices.push(ltp);
  if (previousPrices.length === 300) previousPrices.shift();

  const currentPrice = ltp;
  const isPriceIncreased = previousPrices.some(price => currentPrice >= price * 1.1);

  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize) {
    // Buy
    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    position += maxLots;
    user.availableBalance -= maxLots * currentPrice * lotSize;
    buyPrice = currentPrice;
    stopLoss = buyPrice * 0.9;
    profitTarget = buyPrice * 1.1;
    user.totalTrades++;
    
    const tradeStatement = `Bought at ${buyPrice}, SL: ${stopLoss}, Target: ${profitTarget} (Date: ${formatDateTime(new Date())})`;
    user.trades.push({ tradeStatement });

    console.log(tradeStatement);
  }

  if (position > 0 && (currentPrice <= stopLoss || currentPrice >= profitTarget)) {
    // Sell
    const exitPrice = currentPrice;
    const profit = (exitPrice - buyPrice) * position * lotSize;
    previousPrices = [];
    user.availableBalance += profit;
    user.netProfitOrLoss += profit; 

    const tradeStatement = `Sold at ${exitPrice}, Profit/Loss: ${profit} (Date: ${formatDateTime(new Date())})`;
    user.trades.push({ tradeStatement });

    console.log(tradeStatement);
    position = 0;
  }

  // Update the cached user data in the database
  await updateUser();
};

module.exports = { tradeStrategy };


