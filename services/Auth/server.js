const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');

const app = express();

const PORT = 3000;

mongoose.connect('mongodb://mongo:27017/market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/v1/auth', indexRouter);

app.listen(PORT, () => {
  console.log(`Server run on PORT: ${PORT}`);
});
