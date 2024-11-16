const axios = require('axios');
const TradingSymbols = require('../../models/tradingSymbolsSchema ');
const AccessToken = require('../../models/AccessToken');

let callOptionSymbol = '';
let putOptionSymbol = '';
// const getNextWednesday = () => {
//   const today = new Date();
//   const dayOfWeek = today.getDay();
//   const nextWednesday = new Date(today);
//   const daysToWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek : 10 - dayOfWeek;

//   nextWednesday.setDate(today.getDate() + daysToWednesday);

//   const day = nextWednesday.getDate().toString().padStart(2, '0'); // Add leading zero
//   const month = nextWednesday.toLocaleString('default', { month: 'short' }).toUpperCase();
//   const year = (nextWednesday.getFullYear() % 100).toString();

//   return `${day} ${month} ${year}`;
// };

const getLastWednesday = (holidays = []) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const year = today.getFullYear();
  const lastDayOfMonth = new Date(year, currentMonth + 1, 0);
  let lastWednesday = new Date(lastDayOfMonth);
  while (lastWednesday.getDay() !== 3) {
    lastWednesday.setDate(lastWednesday.getDate() - 1);
  }
  const formatDate = (date) => date.toISOString().split('T')[0];
  if (holidays.includes(formatDate(lastWednesday))) {
    lastWednesday.setDate(lastWednesday.getDate() - 1);
  }
  const day = lastWednesday.getDate().toString().padStart(2, '0');
  const month = lastWednesday.toLocaleString('default', { month: 'short' }).toUpperCase();
  const shortYear = (lastWednesday.getFullYear() % 100).toString();
  return `${day} ${month} ${shortYear}`;
};

const holidays = ["2024-12-25"];
console.log(getLastWednesday(holidays));


const fetchInstrumentKeys = async (tradingSymbolCE, tradingSymbolPE) => {
  const data = require("../../config/NSE.json");

  const instrumentKeyCE = data.find(
    (item) => item.trading_symbol === tradingSymbolCE
  )?.instrument_key;

  const instrumentKeyPE = data.find(
    (item) => item.trading_symbol === tradingSymbolPE
  )?.instrument_key;

  return { instrumentKeyCE, instrumentKeyPE };
};

const fetchBankNiftyTradingSymbols = async () => {
  try {
    const tokenDoc = await AccessToken.findOne({});
    if (!tokenDoc) throw new Error('Access token not found');
    const accessToken = tokenDoc.token;

    const response = await axios.get('https://api.upstox.com/v2/market-quote/ltp?instrument_key=NSE_INDEX%7CNifty%20Bank', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });


    const latestPrice = response.data.data['NSE_INDEX:Nifty Bank'].last_price;

    const roundStrikeAbove = Math.ceil(latestPrice / 100) * 100;
    const roundStrikeBelow = Math.floor(latestPrice / 100) * 100;

    const expirationDate = getLastWednesday(holidays)

    const callOptionSymbol = `BANKNIFTY ${roundStrikeBelow} CE ${expirationDate}`;
    const putOptionSymbol = `BANKNIFTY ${roundStrikeAbove} PE ${expirationDate}`;
    

    const { instrumentKeyCE, instrumentKeyPE } = await fetchInstrumentKeys(callOptionSymbol, putOptionSymbol);
    let name = "Bank Nifty";
    const existingSymbols = await TradingSymbols.findOne({ name });
    if (existingSymbols) {
      // Update existing symbols
      existingSymbols.callOptionSymbol = callOptionSymbol;
      existingSymbols.putOptionSymbol = putOptionSymbol;
      existingSymbols.callInstrumentKey = instrumentKeyCE;
      existingSymbols.putInstrumentKey = instrumentKeyPE;
      existingSymbols.updatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      await existingSymbols.save();
    } else {
      // Save new symbols along with the name and instrument keys
      await TradingSymbols.create({
        name,
        callOptionSymbol,
        putOptionSymbol,
        callInstrumentKey: instrumentKeyCE,
        putInstrumentKey: instrumentKeyPE,
      });
    }

    return { callOptionSymbol, putOptionSymbol, callInstrumentKey: instrumentKeyCE, putInstrumentKey: instrumentKeyPE };

  } catch (error) {
    console.error('Error fetching Bank Nifty value or generating trading symbols:', error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = { fetchBankNiftyTradingSymbols, callOptionSymbol, putOptionSymbol };
