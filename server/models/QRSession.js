const mongoose = require('mongoose');

const QRSessionSchema = new mongoose.Schema({
  sessionKey: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  authenticated: { type: Boolean, default: false },
  authenticatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String },
  webSessionToken: { type: String },
  challenge: { type: String },
  credentialId: { type: String }
});

// TTL index will auto-remove expired docs
QRSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QRSession', QRSessionSchema);
