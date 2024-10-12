const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const router = require('./routes/v1');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: '4mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

/* ALL ROUTES */
app.use('/api/v1', router);

app.use(errorHandler);

module.exports = app;
