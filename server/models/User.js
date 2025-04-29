const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true // Allows for users without email (e.g., passkey only)
  },
  password: String, // Hashed password
  username: String, // For passkey users
  displayName: String, // For passkey users
  credentials: [{
    credentialID: String,
    credentialPublicKey: String,
    counter: Number,
    transports: [String]
  }],
  currentChallenge: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);