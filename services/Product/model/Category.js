const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Category = new Schema({
  category_name: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('category', Category);
