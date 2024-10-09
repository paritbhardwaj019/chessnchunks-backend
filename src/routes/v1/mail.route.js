const express = require('express');
const sendEmail = require('../../utils/sendEmail');

const mailRouter = express.Router();

mailRouter.post('/send', async (req, res) => {
  const sendMail = await sendEmail(
    'paritbhardwaj@outlook.com',
    'Testing Hostgator',
    'text'
  );

  console.log(sendMail);

  res.status(200).send('OK');
});

module.exports = mailRouter;
