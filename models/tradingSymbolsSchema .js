// models/TradingSymbols.js
const mongoose = require('mongoose');

const tradingSymbolsSchema = new mongoose.Schema({
  callOptionSymbol: { type: String, required: true },
  putOptionSymbol: { type: String, required: true },
  callInstrumentKey: { type: String },
  putInstrumentKey: { type: String },
  updatedAt: { type: String, default: Date.now }
});

module.exports = mongoose.model('TradingSymbols', tradingSymbolsSchema);
