const AccessToken = require("../models/AccessToken");

const fetchAccessToken = async () => {
  try {
    const latestToken = await AccessToken.findOne().sort({ createdAt: -1 });
    if (!latestToken) {
      throw new Error("No access token found in the database.");
    }
    return latestToken.token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    return null;
  }
};

module.exports = fetchAccessToken;
