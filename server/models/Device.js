const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true,unique:true }, // e.g., UUID or IMEI from mobile
  createdAt: { type: Date, default: Date.now },
});

DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Device', DeviceSchema);
