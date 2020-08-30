const express = require('express');
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodeMailer = require('nodemailer');

const router = express.Router();

router.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.json({
      errors: {
        message: 'Please input both email and password'
      }
    });
  }
  try {
    const user = await Customer.findOne({ email: email });
    if (!user) {
      res.json({
        errors: {
          message: 'There is no account with this email address!'
        }
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const payload = {
        id: user.id,
        email: user.email
      };
      const token = await jwt.sign(payload, 'marketplaceMeowMeow');
      return res.status(200).json({ token: token });
    } else {
      res.json({
        errors: {
          message: 'Your password is not correct'
        }
      });
    }
  } catch (err) {
    res.status(401).json({
      errors: {
        message: 'This email not belong to any user'
      }
    });
  }
});

router.post('/signup', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  var salt = await bcrypt.genSalt(10);
  var hash = await bcrypt.hashSync(password, salt);

  const findUser = await Customer.findOne({ email });
  if (findUser) {
    return res
      .status(401)
      .json({ message: `This ${email} have already sign up` });
  }

  const user = new Customer({ email: email, password: hash });
  const newUser = await user.save();
  if (newUser) {
    const payload = {
      id: user.id,
      email: user.email
    };
    const token = await jwt.sign(payload, 'marketplaceMeowMeow');
    return res.status(200).json({ token: token });
  }
});

router.post('/update', async (req, res) => {
  const token = req.headers.authorization;
  const isChangePassword = req.query.isChangePassword;
  try {
    const user = await jwt.verify(token, 'marketplaceMeowMeow');
    const findUser = await Customer.findOne({ email: user.email });
    if (!findUser) {
      return res.json({
        errors: { message: 'User not found with this token' }
      });
    }

    if (isChangePassword) {
      const currentPassword = req.body.currentPassword;
      const newPassword = req.body.newPassword;
      const isMatch = await bcrypt.compare(currentPassword, findUser.password);
      if (!isMatch) {
        return res.json({
          errors: { message: 'Your password is not correct' }
        });
      }
      var salt = await bcrypt.genSalt(10);
      var hash = await bcrypt.hashSync(newPassword, salt);

      const result = await Customer.findOneAndUpdate(
        { email: findUser.email },
        { password: hash },
        { useFindAndModify: false }
      );

      if (result) {
        return res
          .status(200)
          .json({ message: 'Update Password Successfully' });
      }
    } else {
      const update = req.body;
      const result = await Customer.findOneAndUpdate(
        { email: findUser.email },
        update,
        { useFindAndModify: false }
      );
      if (result) {
        return res
          .status(200)
          .json({ message: 'Update Account Infor Successfully' });
      }
    }
  } catch (err) {
    console.log('err', err);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.post('/add-address', async (req, res) => {
  const token = req.headers.authorization;
  try {
    const user = await jwt.verify(token, 'marketplaceMeowMeow');
    const findUser = await Customer.findOne({ email: user.email });
    if (!findUser) {
      return res.json({
        errors: { message: 'User not found with this token' }
      });
    }

    const newAddress = req.body;

    const updateAddress = [...findUser.address, { ...newAddress }];
    console.log('updateAddress', updateAddress);
    const result = await Customer.findOneAndUpdate(
      { email: findUser.email },
      { address: updateAddress },
      { useFindAndModify: false }
    );
    if (result) {
      return res
        .status(200)
        .json({ message: 'Update Address Infor Successfully' });
    }
  } catch (err) {
    console.log('err', err);
    res.status(401).json({ errors: { message: 'UnAuthorized' } });
  }
});

router.post('/send-email', async (req, res) => {
  const email = req.body.email;

  try {
    let user = await Customer.findOne({ email });

    if (!user) {
      return res.json({
        errors: { message: 'There is no user with this email' }
      });
    }

    const payload = {
      email: user.email
    };
    const token = await jwt.sign(payload, 'marketplaceMeowMeow');

    let transporter = nodeMailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'duchai283@gmail.com',
        pass: 'lamduchai*28031998'
      }
    });
    const body = `
      <strong style="font-size:28px;color:#7eb357">Forgot Your Password?</strong><br>
      <a href="http://localhost:5000/account/resetPassword/${token}">Set a New Password</a>
    `;
    let mailOptions = {
      from: 'marketplace@snapmart.ph',
      to: email,
      subject: 'Reset your MarketPlace password',
      html: body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
      return res.json({ isSendEmail: true });
    });
  } catch (err) {
    console.log('err', err);
    res.status(401).json({
      errors: {
        message: 'Some things might went wrong! Please try again'
      }
    });
  }
});

router.post('/reset-pass', async (req, res) => {
  const token = req.body.token;
  const password = req.body.password;

  try {
    const data = await jwt.verify(token, 'marketplaceMeowMeow');
    const user = await Customer.findOne({ email: data.email });

    if (!user) {
      return res.json({
        errors: { message: 'There is no user with this email' }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.json({
        errors: {
          message: 'New password has to different from old password'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hashSync(password, salt);

    const result = await Customer.findOneAndUpdate(
      { email: user.email },
      { password: hash },
      { useFindAndModify: false }
    );

    if (result) {
      return res.json({ message: 'Reset Password Succesfully!' });
    }
  } catch (err) {
    console.log('err', err);
    res.status(401).json({
      errors: {
        message: 'Some things might went wrong! Please try again'
      }
    });
  }
});

router.post('/isValidEmail', async (req, res) => {
  const email = req.body.email;
  console.log('email', req.body);
  try {
    const user = await Customer.findOne({ email });

    if (!user) {
      return res.json({
        message: 'There is no user with this email',
        hasEmail: false
      });
    }

    return res.json({ message: 'Email is valid!', hasEmail: true });
  } catch (err) {
    console.log('err', err);
    res.status(401).json({
      errors: {
        message: 'Some things might went wrong! Please try again'
      }
    });
  }
});

module.exports = router;
