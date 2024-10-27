const mongoose = require('mongoose');

const uptimeSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['UP', 'DOWN'],
    required: true,
  },
});

const Uptime = mongoose.model('Uptime', uptimeSchema);

module.exports = Uptime;
