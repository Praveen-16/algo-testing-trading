const mongoose = require('mongoose');

// Define the trade schema
const tradeSchema = new mongoose.Schema({
  tradeStatement: String,  // Statement of the trade, similar to what you're printing in the console
  date: { type: Date, default: Date.now },  // Automatically stores the current date and time
});

// Define the user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capital: { type: Number, required: true },  // User's initial capital
  availableBalance: { type: Number, required: true },  // Updated balance after trades
  netProfitOrLoss: { type: Number, default: 0 },  // Total net profit or loss
  totalTrades: { type: Number, default: 0 },  // Total number of trades
  trades: [],  // List of trade statements with date and time
});

// Create a model for the User
const User = mongoose.model('User', userSchema);

module.exports = User;
