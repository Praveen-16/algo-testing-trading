const TradingSymbols = require("../models/tradingSymbolsSchema");

const fetchInstrumentKeys = async () => {
  try {
    const usernames = ["Nifty 50",  "user10", "user9015"];
    const orderedKeysArray = [];

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const tradingSymbols = await TradingSymbols.find({
        name: new RegExp(username, "i"),
      });

      if (tradingSymbols && tradingSymbols.length > 0) {
        const instrumentKeys = tradingSymbols
          .flatMap((symbol) => [
            symbol.callInstrumentKey,
            symbol.putInstrumentKey,
          ])
          .filter((key) => key);
        orderedKeysArray.push(...instrumentKeys);
      } else {
        orderedKeysArray.push(null, null);
      }
    }

    return orderedKeysArray;
  } catch (error) {
    console.error("Error fetching instrument keys:", error);
    return [];
  }
};

module.exports = fetchInstrumentKeys;
