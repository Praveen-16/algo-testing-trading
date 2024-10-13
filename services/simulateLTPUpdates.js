const { user5CE, user5PE } = require("../user_stratagies/user5");

// Simulate LTP updates every second
const simulateLTPUpdates = async (userName) => {
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

module.exports = { simulateLTPUpdates };
