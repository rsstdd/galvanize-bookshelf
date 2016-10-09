'use strict';

const boom = require('boom');
const bcrypt = require('bcrypt-as-promised');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');
const cookieParser = require('cookie-parser');

const router = express.Router();

router.post('/token', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }

  if (!password || password.length < 8) {
    return next(boom.create(400, 'Password must not be blank'));
  }

  let user;

  knex('users') // in the users password
    .where('email', email) // where 'email' matches email var
    .first() // select the first obj from the arr.
    .then((row) => { // then do something with that data
      if (!row) { // if there is no match
        throw boom.create(400, 'Bad email or password'); // you've got an error the password doesn't match. but you want to be vague
      }

      user = camelizeKeys(row); // since this is psql, make if JS

      return bcrypt.compare(password, user.hashedPassword); // then return the comparison of the password var to the hashed/salted password of the db
    })
    .then(() => {
      delete user.hashedPassword; // then delete it


      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 3); // 3 hours
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '3h'
      });

      res.cookie('token', token, {
        httpOnly: true,
        expires: expiry,
        secure: router.get('env') === 'production'
      });


      res.send(user);
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(400, 'Bad email or password');
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/token', (req, res, next) => {
  res.clearCookie('token');
  res.send(true);
});

module.exports = router;
