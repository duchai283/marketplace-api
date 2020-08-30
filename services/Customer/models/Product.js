const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = new Schema({
  title: {
    type: String,
    required: true
  },
  sku: {
    type: String
  },
  price: {
    type: Number,
    require: true
  },
  final_price: {
    type: Number
  },
  stock: {
    type: Number,
    required: true
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'category'
  },
  subcategory_id: {
    type: Schema.Types.ObjectId,
    ref: 'subcategory'
  },
  desc: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('product', Product);
