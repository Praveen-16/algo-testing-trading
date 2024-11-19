const User = require("../models/User");
const Uptime = require("../models/UpTimeSchema");
const { getLTPs } = require("../services/upstoxService");
const AccessToken = require("../models/AccessToken");
const TradingSymbols = require("../models/tradingSymbolsSchema ");
const { tradeStrategy } = require("../services/marketDataService");
const { closeWebSocket } = require("../services/upstoxService");
const axios = require("axios");
const { clearValues10 } = require("../user_stratagies/user10");
const { clearValues5 } = require("../user_stratagies/user5");
const { fetchNiftyTradingSymbols } = require("../services/indexes/nifty50Data");
const { fetchBankNiftyTradingSymbols } = require("../services/indexes/bankNiftyData")
const { updateUserDetails } = require("../services/simulateLTPUpdates");
const { clearValues606 } = require("../user_stratagies/user606");
const { clearValues9015 } = require("../user_stratagies/user9015");
const { banknifty1Clear } = require("../user_stratagies/BankNifty/bankNifty1");

let instrumentKeyPE = "";
let instrumentKeyCE = "";
let instrumentKeys = ["Nifty PE", "NIFTY CE", "BANKNIFTY 50150 PE 27 NOV 24", "BNBANKNIFTY 50100 CE 27 NOV 24CE"];

const generateToken = async (req, res) => {
  const { code } = req.body;

  console.log(code, "code");

  const url = "https://api.upstox.com/v2/login/authorization/token";
  const headers = {
    accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = {
    code: code,
    client_id: "9a1c6050-d377-4659-bce7-66f4aec2b0a8",
    client_secret: "6cps1pzbpo",
    redirect_uri: "https://192.168.0.166:432/",
    grant_type: "authorization_code",
  };

  try {
    const response = await axios.post(url, new URLSearchParams(data), {
      headers,
    });

    if (response.status === 200) {
      const { access_token } = response.data;
      await AccessToken.findOneAndUpdate(
        {},
        { token: access_token },
        { upsert: true }
      );

      return res.status(200).json({ accessToken: access_token });
    } else {
      console.error("access token gen failed, Unexpected response status:", response.status);
      return res
        .status(response.status)
        .json({ error: "Failed to generate access token" });
    }
  } catch (error) {
    console.error(
      "Error generating access token:",
      error.response?.status || error.message
    );
    return res
      .status(error.response?.status || 500)
      .json({
        error: error.response?.data || "Failed to generate access token",
      });
  }
};

const fetchInstrumentce = async (req, res) => {
  const { tradingSymbol } = req.body;
  const data = require("../config/NSE.json");

  const instrumentKeyCE = data.find(
    (item) => item.trading_symbol === tradingSymbol
  )?.instrument_key;

  if (instrumentKeyCE) {
    let tradingSymbolDoc = await TradingSymbols.findOne({ tradingSymbol });

    if (!tradingSymbolDoc) {
      tradingSymbolDoc = new TradingSymbols({
        tradingSymbol,
        instrumentKey: instrumentKeyCE,
      });
    } else {
      tradingSymbolDoc.instrumentKey = instrumentKeyCE;
    }

    await tradingSymbolDoc.save();

    res.status(200).json({ instrumentKeyCE });
  } else {
    res.status(404).json({ error: "Instrument key not found CE" });
  }
};


const fetchInstrumentpe = async (req, res) => {
  const { tradingSymbol } = req.body;
  const data = require("../config/NSE.json");
  const instrumentKeyPE = data.find(
    (item) => item.trading_symbol === tradingSymbol
  )?.instrument_key;
  if (instrumentKeyPE) {
    let tradingSymbolDoc = await TradingSymbols.findOne({ tradingSymbol });

    if (!tradingSymbolDoc) {
      tradingSymbolDoc = new TradingSymbols({
        tradingSymbol,
        instrumentKey: instrumentKeyPE,
      });
    } else {
      tradingSymbolDoc.instrumentKey = instrumentKeyPE;
    }
    await tradingSymbolDoc.save();
    res.status(200).json({ instrumentKeyPE });
  } else {
    res.status(404).json({ error: "Instrument key not found for the provided trading symbol." });
  }
};


const startTrading = async (req, res) => {
  try {
    const tokenDoc = await AccessToken.findOne({});
    const accessToken = tokenDoc ? tokenDoc.token : null;

    if (
      !instrumentKeys ||
      !Array.isArray(instrumentKeys) ||
      instrumentKeys.length === 0
    ) {
      console.log("No instrument keys found", instrumentKeys);
      return res
        .status(400)
        .json({ error: "No valid instrument keys provided" });
    }

    if (!accessToken) {
      console.log("Access token is missing");
      return res.status(401).json({ error: "Access token is required" });
    }

    const ltpResponse = await getLTPs(instrumentKeys, accessToken);
    clearValues10();
    clearValues5();
    clearValues606();
    clearValues9015();
    banknifty1Clear();

    res.status(200).json({ message: "Trading started successfully" });
  } catch (error) {
    console.error("Error starting trading:", error);
    res.status(500).json({ error: "An error occurred while starting trading" });
  }
};

const stopTrading = async (req, res) => {
  try {
    clearValues10();
    clearValues5();
    clearValues606();
    clearValues9015();
    banknifty1Clear();
    closeWebSocket();
    res.status(200).json({ message: "WebSocket connection closed." });
  } catch (error) {
    console.error("Error stopping WebSocket:", error);
    res
      .status(500)
      .json({ message: "Failed to stop WebSocket connection", error });
  }
};
const getInstruments = async (req, res) => {
  try {
    const tradingSymbols = await TradingSymbols.find({});
    res.status(200).json(tradingSymbols);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching trading symbols' });
  }
};

const getUserData = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user data" });
  }
};

// const upTimeServer = async (req, res) => {
//   try {
//     const uptimeRecord = new Uptime({ status: "UP" });
//     await uptimeRecord.save();
//     const count = await Uptime.countDocuments();
//     if (count > 10) {
//       await Uptime.find().sort({ _id: 1 }).limit(count - 10).deleteMany();
//     }
//     res.status(200).json({ message: "Server is up!" });
//   } catch (error) {
//     console.error("Error logging uptime:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// setInterval(() => {
//   upTimeServer();
// }, 5 * 60 * 1000);


const getNifty50Value = async (req, res) => {
  try {
    const data = await fetchNiftyTradingSymbols();
    if (data) {
      const getInstrumentKeys = async () => {
        try {
          const symbols = await TradingSymbols.findOne({});

          if (!symbols) {
            return res.status(404).json({ error: "No trading symbols found." });
          }

          const { callInstrumentKey, putInstrumentKey } = symbols;
          instrumentKeys[0] = putInstrumentKey;
          instrumentKeys[1] = callInstrumentKey;
        } catch (error) {
          console.error("Error retrieving instrument keys:", error.message);
        }
      };
      getInstrumentKeys();
    }

    res
      .status(200)
      .json({ message: "Trading symbols Nifty 50 generated successfully "+data.callInstrumentKey, data });
  } catch (error) {
    res
      .status(200)
      .json({
        message: "Failed to fetch trading symbols Nifty 50",
        error: error.message,
      });
  }
};

const getBankNiftyValue = async (req, res) => {
  try {
    const data = await fetchBankNiftyTradingSymbols();
    if (data) {
      const getInstrumentKeys = async () => {
        try {
        

          const { callInstrumentKey, putInstrumentKey } = data;
          instrumentKeys[2] = callInstrumentKey;
          instrumentKeys[3] = putInstrumentKey;
        } catch (error) {
          console.error("Error retrieving instrument keys:", error.message);
        }
      };
      getInstrumentKeys();
    }

    res
      .status(200)
      .json({ message: "Trading symbols BankNifty generated successfully "+data.callInstrumentKey, data });
  } catch (error) {
    res
      .status(200)
      .json({
        message: "Failed to fetch trading symbols Bank Nifty",
        error: error.message,
      });
  }
};

const resetUserDetails = async (req, res) => {
  const { name } = req.body; 
  try {
      const updatedUser = await updateUserDetails(name);
      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({messaage:name+" values reset successfully"});
  } catch (error) {
      res.status(500).json({ message: 'Error resetting user details' });
  }
};

const addUnsetteldFunds = async (req, res) => {

  try {
    const users = await User.find();
    for (const user of users) {
      if (user.unsettledFunds > 0) {
        user.availableBalance += user.unsettledFunds;
        user.unsettledFunds = 0;
        await user.save();
        console.log(`Transferred unsettled funds for user ${user.name}`);
      }
    }
    res.status(200).json({messaage:'Daily unsettled funds transfer completed.'});
    console.log('Daily unsettled funds transfer completed.');
  } catch (error) {
    console.error('Error in daily unsettled funds transfer:', error);
    res.status(500).json({ message: 'Error Updating Unsetteled Funds' });
  }
};




module.exports = {
  generateToken,
  fetchInstrumentce,
  fetchInstrumentpe,
  startTrading,
  stopTrading,
  getUserData,
  getInstruments,
  getNifty50Value,
  getBankNiftyValue,
  resetUserDetails,
  addUnsetteldFunds
  // upTimeServer,

};
