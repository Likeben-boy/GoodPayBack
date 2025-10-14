import dotenv from 'dotenv';
dotenv.config();
console.log('LOG_FILE:', process.env.LOG_FILE);

import config from './src/config';
console.log('config.logFile:', config.logFile);
console.log('typeof config.logFile:', typeof config.logFile);