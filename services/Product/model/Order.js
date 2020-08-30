const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order = new Schema(
  {
    shipping: {
      address: String,
      city: String,
      district: String,
      fullname: String,
      label: String,
      phone: String,
      ward: String
    },
    total: {
      items: [],
      totalAmount: Number
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'customer',
      required: true
    },
    state: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at' }
  }
);

module.exports = mongoose.model('order', Order);
