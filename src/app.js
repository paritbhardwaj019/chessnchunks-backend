const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const router = require('./routes/v1');

const app = express();

app.use((req, res, next) => {
  let origin = req.headers.origin;
  let theOrigin =
    config.allowedOrigins.indexOf(origin) >= 0
      ? origin
      : config.allowedOrigins[0];

  res.header('Access-Control-Allow-Origin', theOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-auth-token'
  );

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-auth-token'
    );
    return res.status(200).end();
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
