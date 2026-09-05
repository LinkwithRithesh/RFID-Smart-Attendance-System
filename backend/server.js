require('dotenv').config();

const app = require('./app');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
