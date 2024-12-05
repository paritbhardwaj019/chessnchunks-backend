const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const router = require('./routes/v1');
const { isOriginAllowed } = require('./services/origin.service');
const logger = require('./utils/logger');

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-auth-token,  x-origin-host'
    );

    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE'
      );
      return res.status(200).end();
    }
  } else {
    logger.warn(`Blocked request from unauthorized origin: ${origin}`);
  }

  next();
});

app.use(bodyParser.json({ limit: '4mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

/* ALL ROUTES */
app.use('/api/v1', router);

app.use(errorHandler);

module.exports = app;
