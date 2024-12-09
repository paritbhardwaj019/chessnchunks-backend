const express = require('express');
const {
  verifyAcademyAdminHandler,
} = require('../../../services/superAdmin.service');
const stripe = require('../../../config/stripe');
const config = require('../../../config');
const httpStatus = require('http-status');

const router = express.Router();

router.use('/stripe', express.raw({ type: 'application/json' }));

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { token, domain } = session.metadata;

      try {
        await verifyAcademyAdminHandler(token, domain);
      } catch (error) {
        console.log(error);
        return res.json({ received: true });
      }
    }

    res.json({ received: true });
  } catch (err) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
