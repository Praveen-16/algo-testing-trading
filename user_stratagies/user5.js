
// const User = require('../models/User');

// let ceState = {
//   previousPrices: [],
//   position: 0,
//   buyPrice: 0,
//   stopLoss: 0,
//   profitTarget: 0
// };

// let peState = {
//   previousPrices: [],
//   position: 0,
//   buyPrice: 0,
//   stopLoss: 0,
//   profitTarget: 0
// };

// let lotSize = 25;
// let buyAmount = 0
// let cachedUser = null;
// let isSaving = false;
// let isTradHandler = false;
// const MAX_VALUES_LENGTH = 300;  


// const formatDateTime = (date) => {
//   const options = {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: false,
//     timeZone: 'Asia/Kolkata'
//   };
//   return date.toLocaleString('en-GB', options);
// };


// const fetchUser = async (userName) => {
//   if (!cachedUser) {
//     cachedUser = await User.findOne({ name: userName });
//     if (!cachedUser) {
//       console.error('User not found');
//       return null;
//     }
//   }
//   return cachedUser;
// };
// const createSampleUser = async () => {
//   try {
//     const sampleUser = new User({
//       name: 'test2',
//       capital: 20000,
//       availableBalance: 20000,
//       netProfitOrLoss: 0,
//       totalTrades: 0,
//       trades: [],
//       peValues:[],
//       ceValues:[]
//     });
//     await sampleUser.save();
//     console.log('Sample user added to the database:', sampleUser);
//   } catch (error) {
//     console.error('Error adding sample user:', error);
//   }
// };
// // createSampleUser()


// const updateUser = async (attempts = 3) => {
//   if (cachedUser && !isSaving) {
//     isSaving = true;
//     try {
//       await User.findOneAndUpdate(
//         { _id: cachedUser._id },
//         cachedUser.toObject(),
//         { new: true, maxTimeMS: 5000 }
//       );
//     } catch (error) {
//       if (attempts > 1 && error.code === 'ECONNRESET') {
//         await updateUser(attempts - 1);
//       } else {
//         console.error("Error during save user5:", error);
//       }
//     } finally {
//       isSaving = false;
//     }
//   }
// };


// const tradeHandler = async (ltp, userName, optionType) => {
  
//   if (!isTradHandler) {
//     console.log("Tradhandler started for user ", userName, ", LTP: ", ltp);
//     isTradHandler = true;
//   }
//   let user = await fetchUser(userName);
//   if (!user) return;

//   let state = optionType === 'CE' ? ceState : peState;
//   let valueArray = optionType === 'CE' ? user.ceValues : user.peValues;

//   valueArray.push({
//     value: ltp,
//     time: new Date()  
//   });

//   if (valueArray.length > MAX_VALUES_LENGTH) {
//     valueArray.shift();  
//   }

//   state.previousPrices.push(ltp);
//   if (state.previousPrices.length === MAX_VALUES_LENGTH) state.previousPrices.shift();

//   const currentPrice = ltp;
//   const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * 1.15);

//   // ** Buy Logic **
//   if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize && state.position == 0) {

//     const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
//     state.position += maxLots;
//      buyAmount = (maxLots * currentPrice * lotSize);
//     user.availableBalance -= buyAmount - 50;
//     state.buyPrice = currentPrice;
//     state.stopLoss = state.buyPrice * 0.9;
//     state.profitTarget = state.buyPrice * 1.1;
//     user.totalTrades++;

//     const tradeStatement = `Bought ${optionType} at ${state.buyPrice.toFixed(2)}, Units: ${state.position.toFixed(2)}, Amount: ${buyAmount.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
//     user.trades.push(tradeStatement);

//     // console.log(tradeStatement);
//   }

//   // ** Sell Logic **
//   if (state.position > 0 && (currentPrice <= state.stopLoss || currentPrice >= state.profitTarget)) {
//     const exitPrice = currentPrice;
//     const profit = (exitPrice - state.buyPrice) * state.position * lotSize;
    
//     state.previousPrices.length = 0;
//     user.availableBalance +=  (exitPrice * state.position * lotSize)  -50;
//     user.netProfitOrLoss +=(profit);
//     const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
//     user.trades.push(tradeStatement);

//     // console.log(tradeStatement);
//     state.position = 0;
//     isTradHandler = false;
//   }

//   await updateUser();
// };



// const user5CE = async (ltp, userName) => {
//   await tradeHandler(ltp, userName, 'CE');
// };

// const user5PE = async (ltp, userName) => {
//   await tradeHandler(ltp, userName, 'PE');
// };

// const clearValues5 = ()=>{
//   ceState.previousPrices =[];
//   peState.previousPrices = [];
//   isTradHandler = false;
// }

// module.exports = { user5CE, user5PE, createSampleUser, clearValues5 };







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
let isSaving = false;
let isTradeHandlerActive = false;
let doTrade = true;
const MAX_VALUES_LENGTH = 300;

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
      name: 'user1005',
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

const tradeHandler = async (ltp, userName, optionType) => {
  let user = await fetchUser(userName);
  if(user.todayNegativeTrades == 0 || user.todayNegativeTrades == 1 ){
    doTrade = true;
  }
  if (!doTrade) {
    return;
  }
  if (!isTradeHandlerActive) {
    isTradeHandlerActive = true;
  }

  if (!user) return;

  let state = optionType === 'CE' ? ceState : peState;
  let valueArray = optionType === 'CE' ? user.ceValues : user.peValues;

  valueArray.push({
    value: ltp,
    time: new Date()
  });

  if (valueArray.length > 5) {
    valueArray.shift();
  }

  state.previousPrices.push(ltp);
  if (state.previousPrices.length === MAX_VALUES_LENGTH) state.previousPrices.shift();

  const currentPrice = ltp;
  const isPriceIncreased = state.previousPrices.some(price => currentPrice >= price * 1.25);

  if (isPriceIncreased && user.availableBalance >= currentPrice * lotSize && state.position == 0) {
    const maxLots = Math.floor(user.availableBalance / (currentPrice * lotSize));
    state.position += maxLots;
    buyAmount = (maxLots * currentPrice * lotSize);
    user.availableBalance -= buyAmount - 50;
    state.buyPrice = currentPrice;
    state.stopLoss = state.buyPrice * 0.92;
    state.profitTarget = state.buyPrice * 1.07;
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
      user.todayPositiveTrades +=1
    } else {
      user.availableBalance += (exitPrice * state.position * lotSize) - 50;
      user.totalNegativeTrades += 1;
      user.todayNegativeTrades +=1;
    }
    if (user.todayNegativeTrades > 1) {
      doTrade = false;
      console.log("user lost 2 trades this today, we are closing", user.name)
    }
    if (user.todayPositiveTrades > 1) {
      doTrade = false;
      console.log("user won 2 trades this today, we are closing", user.name)
    }
    user.netProfitOrLoss +=(profit);
    const tradeStatement = `Sold ${optionType} at ${exitPrice.toFixed(2)}, Profit/Loss: ${profit.toFixed(2)}, Balance: ${user.availableBalance.toFixed(2)}, ${formatDateTime(new Date())}`;
    user.trades.push(tradeStatement);
    
    state.previousPrices.length = 0;
    state.position = 0;
    isTradeHandlerActive = false;
  }

  await updateUser();
};

const user5CE = async (ltp, userName) => {
  await tradeHandler(ltp, userName, 'CE');
};

const user5PE = async (ltp, userName) => {
  await tradeHandler(ltp, userName, 'PE');
};

const clearValues5 = () => {
  ceState.previousPrices = [];
  peState.previousPrices = [];
  isTradeHandlerActive = false;
};

module.exports = { user5CE, user5PE, createSampleUser, clearValues5 };
