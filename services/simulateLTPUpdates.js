const { user10PE, user10CE } = require("../user_stratagies/user10");
const { user5CE, user5PE } = require("../user_stratagies/user5");
const User = require('../models/User');

const simulateLTPUpdates = async (userName) => {
  updateUserDetails('test1')
  const minLTP = 100;
  const maxLTP = 300;
  const generateRandomLTP = () => {
    return Math.random() * (maxLTP - minLTP) + minLTP;
  };

  const intervalId = setInterval(async () => {
    const ceLTP = generateRandomLTP();

    const peLTP = generateRandomLTP();

    await user5CE(ceLTP, userName);

    await user5PE(peLTP, userName);
  }, 1000);
};

const simulateLTPUpdates10 = async (userName) => {
  updateUserDetails('test2')
  const minLTP = 100;
  const maxLTP = 300;
  const generateRandomLTP = () => {
    return Math.random() * (maxLTP - minLTP) + minLTP;
  };

  const intervalId = setInterval(async () => {
    const ceLTP = generateRandomLTP();

    const peLTP = generateRandomLTP();

    await user10CE(ceLTP, userName);

    await user10PE(peLTP, userName);
  }, 1000);
};


const updateUserDetails = async (name) => {
  try {
    const user = await User.findOneAndUpdate(
      { name: name },                      // Find the user by name
      { 
        $set: { 
          availableBalance: 20000,        // Hardcoded available balance
          capital: 20000,  
          netProfitOrLoss:0,
          totalTrades:0,               // Hardcoded capital
          peValues: [],                   // Set PE values array to empty
          ceValues: [],                   // Set CE values array to empty
          trades: []                      // Set trades array to empty
        }
      },
      { new: true }                       // Return the updated document
    );

    if (!user) {
      console.log('User not found');
      return null;  // User not found
    }

  
    return user;  // Return the updated user
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;  // Re-throw the error for further handling if needed
  }
};

// updateUserDetails("user5");
// updateUserDetails("user10");

module.exports = { simulateLTPUpdates, simulateLTPUpdates10, updateUserDetails };
