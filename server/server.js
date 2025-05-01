const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/Auth');
require('dotenv').config();
const app = express();
database_url = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms-passkey-auth';
// Database connection
mongoose.connect(database_url)
  .then(() => console.log(`Connected to MongoDB ${database_url}`))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware - Allow all origins for development
app.use(cors());

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server running on port ${PORT}`);
});