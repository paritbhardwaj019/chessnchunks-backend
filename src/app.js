const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const swaggerOptions = require('./config/swaggerOptions');
const {
  scheduleBatchExpiryCheck,
} = require('./cron/batchExpiryNotification.cron');
const {
  checkAndUpdateExpiredBatches,
} = require('./cron/batchStatusUpdate.cron');
const initializeCronJobs = require('./cron/studentSignup.cron');
const errorHandler = require('./middlewares/errorHandler');
const router = require('./routes/v1');
const { isOriginAllowed } = require('./services/origin.service');
const logger = require('./utils/logger');

const app = express();

initializeCronJobs();
scheduleBatchExpiryCheck();
checkAndUpdateExpiredBatches();

const morganMiddleware = morgan('dev', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
});
app.use(morganMiddleware);

app.use('/api/v1/webhook/stripe', express.raw({ type: 'application/json' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-auth-token, x-origin-host, stripe-signature'
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
    return res.status(403).json({ message: 'Forbidden: Origin not allowed' });
  }

  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/webhook/stripe') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', router);

app.use(errorHandler);

module.exports = app;
