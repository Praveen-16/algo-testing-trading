const express = require('express');
const { generateToken, fetchInstrumentce, fetchInstrumentpe, startTrading, getUserData } = require('../controllers/tradingController');
const router = express.Router();

router.post('/token', generateToken);
router.post('/instrumentce', fetchInstrumentce);
router.post('/instrumentpe', fetchInstrumentpe);
router.post('/starttrading', startTrading);
router.post('/userdata', getUserData);

module.exports = router;
