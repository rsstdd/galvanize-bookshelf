'use strict';

const environment = process.env.NODE_ENV || 'development'; // the environmet is the node env for express or dev env
const knexConfig = require('./knexfile')[environment]; // config knex by requiring 
const knex = require('knex')(knexConfig);

module.exports = knex;
