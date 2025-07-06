const path = require('path');

module.exports = {
  webpack(config) {
    config.resolve.alias['@components'] = path.resolve(__dirname, 'src/components');
    config.resolve.alias['@contexts']   = path.resolve(__dirname, 'src/contexts');
    return config;
  }
};
