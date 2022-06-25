const mongoose = require('mongoose');

const personSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    friendList: {
      type: Object,
      required: true,
      default: { friends: [], requests: { sent: {}, incoming: {} } },
    },
    full_name: {
      type: String,
    },
    isOnline: {
      type: Boolean,
      required: true,
      default: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { minimize: false }
);

module.exports = mongoose.model('People', personSchema);
