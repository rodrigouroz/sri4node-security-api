// main config.js file
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

var config = {
  SRI_USER: '#{SRI_USER}',     // TODO: create user and configure in application-setup (global)
  SRI_PASSWORD: '#{SRI_PASSWORD}',
  VSKO_API_HOST: '#{VSKO_API_HOST + "." + VSKO_DOMAIN}'
};


if (process.env.NODE_ENV === 'dev') {
  config = require('./config.local.js');
}

// export config
module.exports = config;
