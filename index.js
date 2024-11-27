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

app.get("/", (req, res) => { res.send("<p>testing trader server is up..</p>") });

app.use("/api/trading", tradingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
