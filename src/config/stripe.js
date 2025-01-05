const Stripe = require('stripe');
const config = require('.');

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia',
});

module.exports = stripe;
