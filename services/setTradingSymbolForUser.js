const TradingSymbols = require('../models/tradingSymbolsSchema');
const { fetchNiftyTradingSymbols } = require('../services/indexes/nifty50Data');

const setTradingSymbolForUser = async (username) => {
  try {
    const data = await fetchNiftyTradingSymbols();

    if (!data) {
      throw new Error("Unable to fetch Nifty trading symbols.");
    }

    const tradingSymbolsData = {
      name: username,
      callOptionSymbol: data.callOptionSymbol,
      putOptionSymbol: data.putOptionSymbol,
      callInstrumentKey: data.callInstrumentKey,
      putInstrumentKey: data.putInstrumentKey,
      updatedAt : new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    };

    const updatedSymbol = await TradingSymbols.findOneAndUpdate(
      { name: username },
      tradingSymbolsData,
      { new: true, upsert: true }
    );

    console.log(`Trading symbols ${updatedSymbol ? 'updated' : 'saved'} for user: ${username}`);
    return data;
  } catch (error) {
    console.error(`Error saving or updating trading symbols for user ${username}:`, error);
  }
};

module.exports = setTradingSymbolForUser;
