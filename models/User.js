const mongoose = require('mongoose');

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  capital: { type: Number, required: true },
  availableBalance: { type: Number, required: true },
  netProfitOrLoss: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  unsettledFunds: { type: Number, default: 0, set: value => parseFloat(value.toFixed(2))},
  trades: [],
  peValues: [{ value: Number, time: { type: Date, default: Date.now } }],
  ceValues: [{ value: Number, time: { type: Date, default: Date.now } }],
  totalPositiveTrades: { type: Number, default: 0 },
  totalNegativeTrades: { type: Number, default: 0 },
  todayTradesCount: { type: Number, default: 0 },
  todayPositiveTrades: { type: Number, default: 0 },
  todayNegativeTrades: { type: Number, default: 0 },
  doTrade: { type: Boolean, default: false },
  instruments: [
    {
      instrumentKey: { type: String, required: true },
      instrumentSymbol: { type: String, required: true }
    }
  ]
}));

module.exports = User;
