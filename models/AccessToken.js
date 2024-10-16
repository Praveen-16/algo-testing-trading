
const mongoose = require('mongoose');

const accessTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AccessToken = mongoose.model('AccessToken', accessTokenSchema);

module.exports = AccessToken;
