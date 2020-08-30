const express = require('express');
const router = express.Router();
const Product = require('../model/Product');
const Category = require('../model/Category');
const SubCategory = require('../model/SubCategory');
const Cart = require('../model/Cart');
const Order = require('../model/Order');
const TrackOrder = require('../model/TrackOrder');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

router.get('/sub-by-category', async (req, res) => {
  const id = req.query.id;
  try {
    const category = await SubCategory.find({
      category_id: id
    });
    res.json({ data: category });
  } catch (error) {
    console.log('err', error);
  }
});

// Cat
router.get('/category', async (req, res) => {
  try {
    const category = await Category.find();
    res.json({ data: category });
  } catch (error) {
    console.log('err', error);
  }
});

router.put('/category', async (req, res) => {
  const body = req.body;
  try {
    const category = await Category.findOneAndUpdate(
      { _id: body._id },
      { category_name: body.category_name },
      { useFindAndModify: false }
    );

    res.json({ data: category, body });
  } catch (error) {
    console.log('err', error);
  }
});

router.delete('/category', async (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.json({ message: 'Delete Category Failed' });
  }
  try {
    const result = await Category.findByIdAndDelete(id);

    res.json({ result });
  } catch (error) {
    console.log('err', error);
  }
});

router.post('/create-category', async (req, res) => {
  const body = req.body;
  try {
    const category = new Category(body);
    const isSuccess = await category.save();
    if (isSuccess._id) {
      res.status(200).json({ message: 'Create Category Success' });
    }
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Category Failed' } });
    console.log('err', error);
  }
});

// Sub Cat
router.get('/sub-category', async (req, res) => {
  try {
    const subCategory = await SubCategory.find();
    res.json({ data: subCategory });
  } catch (error) {
    console.log('err', error);
  }
});

router.put('/sub-category', async (req, res) => {
  const body = req.body;
  try {
    const category = await SubCategory.findOneAndUpdate(
      { _id: body._id },
      { subcategory_name: body.subcategory_name },
      { useFindAndModify: false }
    );

    res.json({ data: category });
  } catch (error) {
    console.log('err', error);
  }
});

router.post('/create-sub-category', async (req, res) => {
  const body = req.body;
  try {
    const subCategory = new SubCategory(body);
    const isSuccess = await subCategory.save();
    if (!isSuccess._id) {
      return res.json({ errors: { message: 'Create Sub Category Success' } });
    }

    res.status(200).json({ message: 'Create Sub Category Success' });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Sub Category Failed' } });
    console.log('err', error);
  }
});

router.delete('/sub-category', async (req, res) => {
  const id = req.query.id;
  if (!id) {
    res.json({ errors: { message: 'Delete Sub-Category Failed' } });
  }
  try {
    const result = await SubCategory.findByIdAndDelete(id);

    res.json({ result });
  } catch (error) {
    console.log('err', error);
  }
});

const generateSku = id => {
  const idString = id + '';
  return idString
    .split('')
    .reduce((acc, curr) => (Number(curr) ? acc + curr : acc), '');
};

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ count: products.length, data: products });
  } catch (error) {
    console.log('err', error);
  }
});

router.get('/products-by-cat', async (req, res) => {
  const id = req.query.id;

  try {
    const products = await Product.find({ category_id: id });
    const category = await Category.findOne({ _id: id });
    res.json({ count: products.length, data: products, cat: category });
  } catch (error) {
    console.log('err', error);
  }
});

router.get('/products-by-sub', async (req, res) => {
  const id = req.query.id;
  try {
    const products = await Product.find({ subcategory_id: id });

    res.json({ count: products.length, data: products });
  } catch (error) {
    console.log('err', error);
  }
});

router.post('/create-product', async (req, res) => {
  const body = req.body;
  try {
    const product = new Product(body);

    const isSuccess = await product.save();

    if (!isSuccess._id) {
      return res.json({ errors: { message: 'Create Product Failed' } });
    }

    const sku = generateSku(isSuccess._id);

    const result = await Product.findOneAndUpdate(
      { _id: isSuccess._id },
      { sku },
      { useFindAndModify: false }
    );

    if (result) {
      res
        .status(200)
        .json({ message: 'Create Product Success', id: isSuccess.title });
    }
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.post('/create-order', async (req, res) => {
  const body = req.body;
  const items = body.total.items;

  try {
    const order = new Order({ ...body, state: 'order_accepted' });
    const isSuccess = await order.save();

    if (isSuccess) {
      for (let i = 0; i < items.length; i++) {
        const product = await Product.findOne({
          _id: items[i].product._id
        });
        const newStock = product.stock - items[i].qty;
        await Product.findOneAndUpdate(
          { _id: product._id },
          { stock: newStock },
          { useFindAndModify: false }
        );
      }
      await Cart.findOneAndUpdate(
        { user_id: body.user_id },
        { items: [], totalSaving: 0, totalAmount: 0 },
        { useFindAndModify: false }
      );
      const trackorder = new TrackOrder({
        state: 'order_accepted',
        level: 0,
        journeys: [
          { status: '', state: 'order_accepted', created_at: Date.now() }
        ],
        order_id: isSuccess._id
      });
      await trackorder.save();
    }
    return res.json({ message: 'Create Order Success' });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.get('/orders', async (req, res) => {
  const token = req.headers.authorization;
  try {
    const user = await jwt.verify(token, 'marketplaceMeowMeow');
    console.log('user', user);

    const order = await Order.find({
      user_id: mongoose.Types.ObjectId(user.id)
    });
    return res.json({ data: order, user });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.get('/order-details', async (req, res) => {
  const id = req.query.id;
  console.log('id', id);
  try {
    const order = await Order.findOne({
      _id: mongoose.Types.ObjectId(id)
    });

    console.log('order', order);

    return res.json({ data: order });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.get('/cancel-order', async (req, res) => {
  const id = req.query.id;

  try {
    const data = await Order.findOneAndUpdate(
      { _id: id },
      { state: 'order_cancelled' },
      { useFindAndModify: false }
    );

    const tracktrace = await TrackOrder.findOne({ order_id: id });
    if (tracktrace) {
      const updateTrack = await TrackOrder.findOneAndUpdate(
        { order_id: id },
        {
          state: 'order_cancelled',
          level: -1,
          journeys: [
            ...tracktrace.journeys,
            { state: 'order_cancelled', status: '', created_at: Date.now() }
          ]
        },
        { useFindAndModify: false }
      );
    }

    return res.json({ data: data });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

const STATETOLEVEL = {
  order_accepted: {
    level: 0
  },
  order_fulfilled: {
    level: 1
  },
  order_delivery: {
    level: 2
  },
  order_completed: {
    level: 3
  },
  order_cancelled: {
    level: -1
  }
};

router.put('/track-order', async (req, res) => {
  const id = req.query.id;
  const status = req.query.status;

  try {
    const tracktrace = await TrackOrder.findOne({ order_id: id });
    console.log('tracktrace', tracktrace);
    if (tracktrace) {
      const journeys = tracktrace.journeys;
      const findIndex = journeys.findIndex(item => item.state === status);
      const level = tracktrace.level;
      if (findIndex === -1) {
        if (status !== 'order_cancelled') {
          const data = await Order.findOneAndUpdate(
            { _id: id },
            { state: status },
            { useFindAndModify: false }
          );

          const updateTrack = await TrackOrder.findOneAndUpdate(
            { order_id: id },
            {
              state: status,
              level: STATETOLEVEL[status].level,
              journeys: [
                ...tracktrace.journeys,
                { state: status, status: '', created_at: Date.now() }
              ]
            },
            { useFindAndModify: false }
          );
          return res.json({ message: 'Cập nhật trạng thái thành công' });
        } else {
          if (level !== 0) {
            return res.json({ message: 'Đơn hàng đang xử lí, không thể huỷ' });
          } else {
            const data = await Order.findOneAndUpdate(
              { _id: id },
              { state: status },
              { useFindAndModify: false }
            );

            const updateTrack = await TrackOrder.findOneAndUpdate(
              { order_id: id },
              {
                state: status,
                level: STATETOLEVEL[status].level,
                journeys: [
                  ...tracktrace.journeys,
                  { state: status, status: '', created_at: Date.now() }
                ]
              },
              { useFindAndModify: false }
            );
          }
        }
      } else {
        return res.json({ message: 'Trạng thái này đã có' });
      }
    } else {
      return res.json({ message: 'Cập nhật trạng thái không thành công' });
    }
  } catch (error) {
    res.status(400).json({ errors: { message: 'Cant Change Status' } });
    console.log('err', error);
  }
});

router.get('/all-orders', async (req, res) => {
  try {
    const order = await Order.find();
    return res.json({ data: order });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.get('/order', async (req, res) => {
  const id = req.query.id;
  try {
    const order = await Order.findOne({ _id: id });
    return res.json({ data: order });
  } catch (error) {
    res.status(400).json({ errors: { message: 'Create Product Failed' } });
    console.log('err', error);
  }
});

router.get('/search', async (req, res) => {
  const title = req.query.title;
  try {
    const products = await Product.find({
      title: new RegExp(title, 'i')
    });

    res.json({ data: products });
  } catch (error) {
    console.log('err', error);
  }
});

router.get('/search-by-sku', async (req, res) => {
  const sku = req.query.sku;
  try {
    const products = await Product.findOne({
      sku
    });

    console.log('products', products);

    res.json({ data: products });
  } catch (error) {
    console.log('err', error);
  }
});

router.get('/track-order', async (req, res) => {
  const id = req.query.id;
  try {
    const trackorder = await TrackOrder.findOne({
      order_id: id
    });

    console.log('trackorder', trackorder);

    res.json({ data: trackorder });
  } catch (error) {
    console.log('err', error);
  }
});

module.exports = router;
