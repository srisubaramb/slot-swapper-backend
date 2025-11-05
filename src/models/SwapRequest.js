const mongoose = require('mongoose');
const SwapRequestSchema = new mongoose.Schema({
  mySlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  theirSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('SwapRequest', SwapRequestSchema);
