const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Cart = new Schema(
  {
    items: {
      type: Array,
      default: []
    },
    totalAmount: {
      type: Number,
      required: true
    },
    totalSaving: {
      type: Number,
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'category',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at' }
  }
);

module.exports = mongoose.model('cart', Cart);
