const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubCategory = new Schema({
  subcategory_name: {
    type: String,
    required: true
  },
  category_id: {
    type: Schema.Types.ObjectId,
    ref: 'category',
    required: true
  }
});

module.exports = mongoose.model('subcategory', SubCategory);
