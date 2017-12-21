// main config.js file
const fs = require('fs')

const configurationFile = 'sri4node-security-api-config.json';

const config = JSON.parse(
    fs.readFileSync(configurationFile)
);

[ 'sriUser', 'sriPassword', 'vskoApiHost' ].forEach( key => {
  if (config[key] === undefined || config[key] === '') {
    throw `Fatal error: sri4node-security-api configuration file is lacking value for ${key}.`
  }
} )

// export config
module.exports = config;
