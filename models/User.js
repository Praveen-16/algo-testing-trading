const mongoose = require('mongoose');

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  capital: { type: Number, required: true },
  availableBalance: { type: Number, required: true },
  netProfitOrLoss: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  unsettledFunds: { type: Number, default: 0 },
  trades: [],
  peValues: [{ value: Number, time: { type: Date, default: Date.now } }],
  ceValues: [{ value: Number, time: { type: Date, default: Date.now } }]
}));

module.exports = User;
