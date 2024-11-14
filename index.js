const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const tradingRoutes = require("./routes/tradingRoutes");
const cors = require("cors");
const axios = require("axios");

require("./controllers/trasferSetteledFunds");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const connectDB = require("./config/db");
connectDB();
app.get("/", (req, res) => {
  res.send("<h1>testing trader server is up..</h1>");
});

// app.get("/upstox/login", (req, res) => {
//   const clientId = "9a1c6050-d377-4659-bce7-66f4aec2b0a8";
//   const redirectUri = "https://192.168.0.166:432/"; // Your Redirect URI
//   const state = "your_random_state"; // Optional state for security

//   const url = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

//   // Redirect the user to the Upstox login page
//   res.redirect(url);
// });
// app.get("/", (req, res) => {
//   const { code, state } = req.query; // Extract 'code' and 'state' from the query parameters
//   if (code) {
//     console.log("Authorization Code:", code); // Print the code to the console
//     // You can now use the 'code' for further API calls (e.g., exchanging for an access token)
//   } else {
//     console.log("Code not received or request is missing the 'code' parameter");
//   }
//   res.send("Authorization completed.");
// });
// app.get("/upstox/callback", async (req, res) => {
//   // Capture the code from the URL query parameters
//   const { code, state } = req.query; // Extract the 'code' and 'state' from URL
//   console.log(code);
//   console.log(req, "ree");
//   if (!code) {
//     return res.status(400).json({ error: "No authorization code provided." });
//   }

//   // Optionally check the state value to prevent CSRF attacks
//   const expectedState = "some-random-state";
//   if (state !== expectedState) {
//     return res
//       .status(400)
//       .json({ error: "State mismatch, possible CSRF attack." });
//   }

//   // Now use the code to fetch the access token
//   const url = "https://api.upstox.com/v2/login/authorization/token";
//   const headers = {
//     accept: "application/json",
//     "Content-Type": "application/x-www-form-urlencoded",
//   };

//   const data = {
//     code: code,
//     client_id: "9a1c6050-d377-4659-bce7-66f4aec2b0a8",
//     client_secret: "6cps1pzbpo",
//     redirect_uri: "https://192.168.0.166:432/",
//     grant_type: "authorization_code",
//   };

//   try {
//     // Make a POST request to Upstox to exchange the code for an access token
//     const response = await axios.post(url, new URLSearchParams(data), {
//       headers,
//     });

//     if (response.status === 200) {
//       const { access_token } = response.data;

//       // Store the access token in the database (or use it as needed)
//       await AccessToken.findOneAndUpdate(
//         {},
//         { token: access_token },
//         { upsert: true }
//       );

//       // Send back the access token
//       return res.status(200).json({ accessToken: access_token });
//     } else {
//       return res
//         .status(response.status)
//         .json({ error: "Failed to get access token." });
//     }
//   } catch (error) {
//     console.error("Error while generating access token:", error.message);
//     return res.status(500).json({ error: "Error generating access token" });
//   }
// });

app.use("/api/trading", tradingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
