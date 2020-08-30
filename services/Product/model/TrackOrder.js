const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackOrder = new Schema(
  {
    state: {
      type: String,
      required: true
    },
    journeys: {
      type: Array,
      default: [],
      required: true
    },
    level: {
      type: Number,
      required: true
    },
    order_id: {
      type: Schema.Types.ObjectId,
      ref: 'order',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at' }
  }
);

module.exports = mongoose.model('trackorders', TrackOrder);
