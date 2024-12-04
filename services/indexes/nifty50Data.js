const axios = require("axios");
const TradingSymbols = require("../../models/tradingSymbolsSchema");
const AccessToken = require("../../models/AccessToken");

let callOptionSymbol = "";
let putOptionSymbol = "";

const getNextThursday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const nextThursday = new Date(today);
  const daysToThursday = dayOfWeek <= 4 ? 4 - dayOfWeek : 11 - dayOfWeek;

  nextThursday.setDate(today.getDate() + daysToThursday);

  const day = nextThursday.getDate().toString().padStart(2, "0");
  const month = nextThursday
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const year = (nextThursday.getFullYear() % 100).toString();

  const formattedDate = `${day} ${month} ${year}`;
  return formattedDate;
};

const fetchInstrumentKeys = async (tradingSymbolCE, tradingSymbolPE) => {
  const data = require("../../config/NSE.json");

  // Fetch Instrument Key for Call Option (CE)
  const instrumentKeyCE = data.find(
    (item) => item.trading_symbol === tradingSymbolCE
  )?.instrument_key;

  // Fetch Instrument Key for Put Option (PE)
  const instrumentKeyPE = data.find(
    (item) => item.trading_symbol === tradingSymbolPE
  )?.instrument_key;

  // Return both instrument keys
  return { instrumentKeyCE, instrumentKeyPE };
};

const fetchNiftyTradingSymbols = async () => {
  try {
    const tokenDoc = await AccessToken.findOne({});
    if (!tokenDoc) throw new Error("Access token not found");
    const accessToken = tokenDoc.token;

    // Fetch the latest Nifty 50 price
    const response = await axios.get(
      "https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_INDEX%7CNifty%2050",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const latestPrice = response.data.data["NSE_INDEX:Nifty 50"].last_price;

    const roundStrikeAbove = Math.ceil(latestPrice / 50) * 50;
    const roundStrikeBelow = Math.floor(latestPrice / 50) * 50;

    const expirationDate = getNextThursday();
    const callOptionSymbol = `NIFTY ${roundStrikeBelow} CE ${expirationDate}`;
    const putOptionSymbol = `NIFTY ${roundStrikeAbove} PE ${expirationDate}`;

    const { instrumentKeyCE, instrumentKeyPE } = await fetchInstrumentKeys(
      callOptionSymbol,
      putOptionSymbol
    );



    return {
      callOptionSymbol,
      putOptionSymbol,
      callInstrumentKey: instrumentKeyCE,
      putInstrumentKey: instrumentKeyPE,
    };
  } catch (error) {
    console.error(
      "Error fetching Nifty 50 value or generating trading symbols:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
// fetchNiftyTradingSymbols()

module.exports = {
  fetchNiftyTradingSymbols,
  callOptionSymbol,
  putOptionSymbol,
};
