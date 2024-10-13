const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  tradingSymbol: { type: String, required: true },
  buyPrice: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  profit: { type: Number, required: true },
});

module.exports = mongoose.model('Trade', tradeSchema);
