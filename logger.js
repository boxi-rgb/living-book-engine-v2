// logger.js
const Logger = {
  _log: (level, ...args) => {
    const timestamp = new Date().toISOString();
    if (level === 'ERROR') {
      console.error(`[${timestamp}] [${level}]`, ...args);
    } else if (level === 'WARN') {
      console.warn(`[${timestamp}] [${level}]`, ...args);
    } else {
      console.log(`[${timestamp}] [${level}]`, ...args);
    }
  },
  info: (...args) => Logger._log('INFO', ...args),
  warn: (...args) => Logger._log('WARN', ...args),
  error: (...args) => Logger._log('ERROR', ...args),
  debug: (...args) => {
    if (process.env.DEBUG_MODE === 'true') {
      Logger._log('DEBUG', ...args);
    }
  }
};

module.exports = Logger;
