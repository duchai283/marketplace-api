const express = require('../node_modules/express');
const router = express.Router();
const User = require('../models/Customer');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const Customer = require('../models/Customer');
const fetch = require('node-fetch');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  const userfind = await User.find();
  res.json({ message: 'Customers', userfind });
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization;
  try {
    const data = await jwt.verify(token, 'marketplaceMeowMeow');
    let user = await Customer.findById(data.id);

    if (user) {
      user.password = null;
      return res.json({ user });
    }
  } catch (error) {
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.get('/city', async (req, res) => {
  try {
    const request = await fetch('https://thongtindoanhnghiep.co/api/city');
    const data = await request.json();
    return res.status(200).json(data);
  } catch (err) {
    console.log('eror', err);
    res.status(500).json({ errors: { message: 'Failed to fetch city' } });
  }
});

router.get('/district', async (req, res) => {
  const idCity = req.query.idCity;
  try {
    const request = await fetch(
      `https://thongtindoanhnghiep.co/api/city/${idCity}/district`
    );
    const data = await request.json();
    return res.status(200).json(data);
  } catch (err) {
    console.log('eror', err);
    res.status(500).json({ errors: { message: 'Failed to fetch district' } });
  }
});

router.get('/ward', async (req, res) => {
  const idDistrict = req.query.idDistrict;
  try {
    const request = await fetch(
      `https://thongtindoanhnghiep.co/api/district/${idDistrict}/ward`
    );
    const data = await request.json();
    return res.status(200).json(data);
  } catch (err) {
    console.log('eror', err);
    res.status(500).json({ errors: { message: 'Failed to fetch ward' } });
  }
});

router.get('/empty-cart', async (req, res) => {
  const token = req.headers.authorization;

  try {
    const data =
      token !== 'null'
        ? await jwt.verify(token, 'marketplaceMeowMeow')
        : '5f487b33e8b16000201466a1';

    let user = await Customer.findById(token !== 'null' ? data.id : data);
    if (user) {
      const data = await Cart.findOneAndUpdate(
        { user_id: token ? user._id : user },
        {
          items: [],
          totalAmount: 0,
          totalSaving: 0
        },
        { useFindAndModify: false, new: true }
      );

      const cart2 = await Cart.findOneAndUpdate(
        { user_id: '5f487b33e8b16000201466a1' },
        {
          items: [],
          totalAmount: 0,
          totalSaving: 0
        },
        { useFindAndModify: false, new: true }
      );

      return res.json({ cart: data });
    }
  } catch (error) {
    console.log('error', error);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.get('/sync-cart', async (req, res) => {
  const token = req.headers.authorization;
  console.log('token', token);
  try {
    const data = await jwt.verify(token, 'marketplaceMeowMeow');

    let user = await Customer.findById({
      _id: data.id
    });
    console.log('user', user);
    if (user) {
      const syncCart = await Cart.findOneAndUpdate(
        { user_id: '5f487b33e8b16000201466a1' },
        {
          user_id: user.id
        },
        { useFindAndModify: false, new: true }
      );

      const newCart = new Cart({
        items: [],
        totalSaving: 0,
        totalAmount: 0,
        user_id: '5f487b33e8b16000201466a1'
      });
      await newCart.save();
      res.json({ cart: syncCart });
    }
  } catch (error) {
    console.log('error', error);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.get('/cart', async (req, res) => {
  const token = req.headers.authorization;
  console.log('token', token);
  try {
    const data =
      token !== 'null'
        ? await jwt.verify(token, 'marketplaceMeowMeow')
        : '5f487b33e8b16000201466a1';
    console.log('data', data);
    let user = await Customer.findById({
      _id: token !== 'null' ? data.id : data
    });
    console.log('user', user);
    if (user) {
      const cart = await Cart.find({ user_id: user.id });
      if (cart.length === 0) {
        const newCart = new Cart({
          items: [],
          totalSaving: 0,
          totalAmount: 0,
          user_id: user.id
        });
        const cartData = await newCart.save();
        res.json({ cart: cartData });
      } else {
        res.json({ cart: cart[0] });
      }
    }
  } catch (error) {
    console.log('error', error);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.put('/cart', async (req, res) => {
  const token = req.headers.authorization;
  const item = req.body.item || {};
  console.log('token', token);
  try {
    const data =
      token !== 'null'
        ? await jwt.verify(token, 'marketplaceMeowMeow')
        : '5f487b33e8b16000201466a1';

    let user = await Customer.findById(token !== 'null' ? data.id : data);
    console.log('user', user);
    if (user) {
      const cart = await Cart.find({ user_id: user.id });

      const cartData = cart[0];
      // console.log('cartData', cartData);
      const product = await Product.findOne({ _id: item.id_product });
      const indexProduct = cartData.items.findIndex(
        i => i.product._id == product.id
      );

      console.log('indexProduct', indexProduct);
      if (indexProduct !== -1 && item.qty === 0) {
        const newCart = _.cloneDeep(cartData);
        newCart.items = newCart.items.filter(
          item => item.product._id != product.id
        );

        newCart.totalAmount = newCart.items.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );

        newCart.totalSaving = newCart.items.reduce(
          (acc, curr) => acc + curr.totalSaving,
          0
        );
        const data = await Cart.findOneAndUpdate(
          { user_id: user._id },
          {
            items: newCart.items,
            totalAmount: newCart.totalAmount,
            totalSaving: newCart.totalSaving
          },
          { useFindAndModify: false, new: true }
        );

        return res.json({ cart: data });
      }

      if (indexProduct === -1) {
        const newCart = _.cloneDeep(cartData);

        newCart.items = [
          ...newCart.items,
          {
            product,
            qty: item.qty,
            totalAmount: product.final_price
              ? product.final_price * item.qty
              : product.price * item.qty,
            totalSaving: product.final_price
              ? (product.price - product.final_price) * item.qty
              : 0
          }
        ];

        newCart.totalAmount = newCart.items.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );

        newCart.totalSaving = newCart.items.reduce(
          (acc, curr) => acc + curr.totalSaving,
          0
        );

        console.log('newCart', newCart);
        const data = await Cart.findOneAndUpdate(
          { user_id: user._id },
          {
            items: newCart.items,
            totalAmount: newCart.totalAmount,
            totalSaving: newCart.totalSaving
          },
          { useFindAndModify: false, new: true }
        );

        res.json({ cart: data });
      } else {
        const newCart = _.cloneDeep(cartData);
        const newQty = item.qty;

        const newTotalAmount = product.final_price
          ? product.final_price * newQty
          : product.price * newQty;

        const newTotalSaving = product.final_price
          ? (product.price - product.final_price) * newQty
          : 0;

        newCart.items[indexProduct] = {
          product,
          qty: newQty,
          totalAmount: newTotalAmount,
          totalSaving: newTotalSaving
        };

        newCart.totalAmount = newCart.items.reduce(
          (acc, curr) => acc + curr.totalAmount,
          0
        );

        newCart.totalSaving = newCart.items.reduce(
          (acc, curr) => acc + curr.totalSaving,
          0
        );

        const data = await Cart.findOneAndUpdate(
          { user_id: user.id },
          {
            items: newCart.items,
            totalAmount: newCart.totalAmount,
            totalSaving: newCart.totalSaving
          },
          { useFindAndModify: false, new: true }
        );

        res.json({ cart: data });
      }
    }
  } catch (error) {
    console.log('err', error);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

module.exports = router;
