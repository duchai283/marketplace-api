const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Customer = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  address: {
    type: Array,
    default: []
  }
});

module.exports = mongoose.model('customer', Customer);
