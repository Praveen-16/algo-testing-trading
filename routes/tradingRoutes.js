const express = require('express');
const { generateToken, fetchInstrumentce, fetchInstrumentpe, startTrading, getUserData,stopTrading } = require('../controllers/tradingController');
const router = express.Router();

router.post('/token', generateToken);
router.post('/instrumentce', fetchInstrumentce);
router.post('/instrumentpe', fetchInstrumentpe);
router.post('/starttrading', startTrading);
router.post('/userdata', getUserData);
router.post('/stop-websocket',stopTrading );

module.exports = router;
