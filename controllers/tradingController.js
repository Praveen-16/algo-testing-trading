const User = require('../models/User');
const {  getLTPs } = require("../services/upstoxService");
const AccessToken = require('../models/AccessToken'); 
const { tradeStrategy } = require("../services/marketDataService");
const {closeWebSocket} = require("../services/upstoxService")
const axios = require("axios");

let instrumentKeyPE = ''
let instrumentKeyCE = ''
let instrumentKeys = ['0','1']

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
    const response = await axios.post(url, new URLSearchParams(data), { headers });

    if (response.status === 200) {
      const { access_token } = response.data;
      console.log("Token Generated: ", access_token);
    
      await AccessToken.findOneAndUpdate({}, { token: access_token }, { upsert: true });

      return res.status(200).json({ accessToken: access_token });
    } else {
      console.error("Unexpected response status:", response.status);
      return res.status(response.status).json({ error: "Failed to generate access token" });
    }
  } catch (error) {
    console.error("Error generating access token:", error.response?.status || error.message);
    return res.status(error.response?.status || 500).json({ error: error.response?.data || "Failed to generate access token" });
  }
};


const fetchInstrumentce = async (req, res) => {
  const { tradingSymbol } = req.body;
  const data = require("../config/NSE.json");

  instrumentKeyCE = data.find(
    (item) => item.trading_symbol === tradingSymbol
  )?.instrument_key;

  if (instrumentKeyCE) {
   
    instrumentKeys[1]=instrumentKeyCE
    res.status(200).json({ instrumentKeyCE });
  } else {
    res.status(404).json({ error: "Instrument key not found CE" });
  }
};

const fetchInstrumentpe = async (req, res) => {
  const { tradingSymbol } = req.body;
  const data = require("../config/NSE.json");

  instrumentKeyPE = data.find(
    (item) => item.trading_symbol === tradingSymbol
  )?.instrument_key;

  if (instrumentKeyPE) {
  
    instrumentKeys[0]=instrumentKeyPE;
    res.status(200).json({ instrumentKeyPE });

  } else {
    res.status(404).json({ error: "Instrument key not found PE" });
  }
};

const startTrading = async (req, res) => {
  try {
    const tokenDoc = await AccessToken.findOne({});
    const accessToken = tokenDoc ? tokenDoc.token : null;

    if (!instrumentKeys || !Array.isArray(instrumentKeys) || instrumentKeys.length === 0) {
      console.log("No instrument keys found", instrumentKeys);
      return res.status(400).json({ error: "No valid instrument keys provided" });
    }

    if (!accessToken) {
      console.log("Access token is missing");
      return res.status(401).json({ error: "Access token is required" });
    }

    const ltpResponse = await getLTPs(instrumentKeys, accessToken);

    res.status(200).json({ message: "Trading started successfully" });
  } catch (error) {
    console.error("Error starting trading:", error);
    res.status(500).json({ error: "An error occurred while starting trading" });
  }
};

const stopTrading = async (req, res) => {
  try {
    closeWebSocket(); 
    res.status(200).json({ message: 'WebSocket connection closed.' });
  } catch (error) {
    console.error('Error stopping WebSocket:', error);
    res.status(500).json({ message: 'Failed to stop WebSocket connection', error });
  }
}


const getUserData = async (req, res) => {
  try {
    const { name } = req.body;  

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
};



module.exports = { generateToken, fetchInstrumentce,fetchInstrumentpe, startTrading,stopTrading, getUserData };
