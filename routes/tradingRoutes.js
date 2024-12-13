const express = require('express');
const { generateToken, fetchInstrumentce, fetchInstrumentpe, startTrading, getUserData,stopTrading, getInstruments, getNifty50Value, getBankNiftyValue, resetUserDetails,addUnsetteldFunds, getUserStateDetails, upTimeServer } = require('../controllers/tradingController');
const router = express.Router();

router.post('/token', generateToken);
router.post('/instrumentce', fetchInstrumentce);
router.post('/instrumentpe', fetchInstrumentpe);
router.post('/starttrading', startTrading);
router.post('/userdata', getUserData);
router.post('/stop-websocket',stopTrading );
router.get('/instruments', getInstruments)
router.get('/nifty50data', getNifty50Value);
router.get('/bankniftydata', getBankNiftyValue);
router.post('/resetUserDetails', resetUserDetails);
router.post('/addUnsetteldFunds', addUnsetteldFunds);
router.post('/getuserstate', getUserStateDetails);

// router.get('/uptime',upTimeServer);
  

module.exports = router;
