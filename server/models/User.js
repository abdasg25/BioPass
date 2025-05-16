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
  },
  authenticated: {
  type: Boolean,
  default: false
},
createdAt: {
  type: Date,
  default: Date.now
}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);