var config = {};

config.dbConnectionString = 'exchange';
config.dbCollections = ['orderLog', 'userRegistry'];
config.currency1 = {
  name: 'BTC',
  decimals: 10,
  constant: Math.pow(10, 10)
};
config.currency2 = {
  name: 'USD',
  decimals: 4,
  constant: Math.pow(10, 4)
};

module.exports = config;
