const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true // Allows for users without email (e.g., passkey only)
  },
  password: String, // Hashed password
  username: {
    type: String,
    unique: true,
    required: false
  }, // For passkey users
  displayName: String, // For passkey users
  name: String, // For storing real name
  credentials: [
    {
      credentialID: { type: String, required: true },
      credentialPublicKey: { type: String, required: true },
      counter: { type: Number, default: 0 },
      transports: [{ type: String }]
    }
  ],
  currentChallenge: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);