const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const tradingRoutes = require('./routes/tradingRoutes');
const cors = require('cors');
require('./controllers/trasferSetteledFunds');



dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const connectDB = require('./config/db');
connectDB();
app.get('/', (req, res) => {
    res.send('<h1>testing trader server is up..</h1>');
  });
app.use('/api/trading', tradingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
