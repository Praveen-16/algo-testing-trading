const mongoose = require('mongoose');

// Check if the model is already compiled before defining it
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  capital: { type: Number, required: true },  // User's initial capital
  availableBalance: { type: Number, required: true },  // Updated balance after trades
  netProfitOrLoss: { type: Number, default: 0 },  // Total net profit or loss
  totalTrades: { type: Number, default: 0 },  // Total number of trades
  trades: [],  // List of trade statements with date and time
  peValues: [{ value: Number, time: { type: Date, default: Date.now } }],  // PE values with time
  ceValues: [{ value: Number, time: { type: Date, default: Date.now } }]   // CE values with time
}));

module.exports = User;
