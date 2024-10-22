const mongoose = require('mongoose');

// Schema to store the instrument key with a timestamp
const instrumentKeySchema = new mongoose.Schema({
  instrumentKey: {
    type: String,
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now, 
  },
});

// Create the model
const InstrumentKey = mongoose.model('InstrumentKey', instrumentKeySchema);

module.exports = InstrumentKey;
