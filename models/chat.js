const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatData: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  sender_id: {
    type: String,
    required: true,
  },
  receiver_id: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  isRemoved: { type: Boolean },
  replyTo: { type: Object },
  editHistory: {
    type: Array,
  },
});

module.exports = mongoose.model('ChatHistory', chatSchema);
