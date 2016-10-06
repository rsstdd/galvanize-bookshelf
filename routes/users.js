'use strict'; // requires you to write in strict mode; no globals/no eval/must use === and more

const express = require('express'); // require express
const knex = require('../knex'); // require knex <-- knex.js is the config file
const { camelizeKeys, decamelizeKeys } = require('humps'); // require humps, which snakecase/camelcase
const boom = require('boom'); // boom makes error handling easier. creates an object for you
const bcyrpt = require('bcrypt-as-promised'); // bcrypt-as-promised is a hashing fn

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/users', (req, res, next) => {
  const { email, firstName, password, lastName } = req.body; // destructuring the req.body obj; pulling the email password, etc from that object

  if (!email || !email.trim()) { // if no email; or no trimmed email
  return next(boom.create(400, 'Email must not be blank')); // return next and create 400 error
  }
  if (!password || password.length < 8) {
    return next(boom.create(400, 'Password must be at least 8 characters long'));
  }
  if (!firstName || !firstName.trim()) {
    return next(boom.create(400, 'First Name must not be blank'));
  }
  if (!lastName || !lastName.trim()) {
    return next(boom.create(400, 'Last Name must not be blank'));
  }

  knex('users')
    .where('email', email)
    .then((rows) => {
      if (rows.length) { // 0, therefore falsey
        return next(boom.create(400, 'Email already exists'));
      }

      bcyrpt.hash(password, 12)
        .then((hashedPassword) => {
          const insertUser = { email, firstName, hashedPassword, lastName };

          return knex('users').insert(decamelizeKeys(insertUser), '*');
        })
        .then((rows) => {
          const user = camelizeKeys(rows[0]);

          delete user.hashedPassword;

          res.send(user);
        })
        .catch((err) => {
          next(err);
        });
    });
});

module.exports = router;
