const express = require('express');
const { generateToken, fetchInstrumentce, fetchInstrumentpe, startTrading, getUserData,stopTrading, getInstruments, getNifty50Value, getBankNiftyValue, upTimeServer } = require('../controllers/tradingController');
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
// router.get('/uptime',upTimeServer);
  

module.exports = router;
