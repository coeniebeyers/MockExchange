var orders = [];

var accountId = 0;
var timestamp = 1481536182349;

orders.push({
  timestamp: timestamp,
  id: '4e367fd0-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 750,
  amount: 100
});
orders.push({
  timestamp: timestamp+1,
  id: '4e374320-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 751,
  amount: 100
});
orders.push({
  timestamp: timestamp+2,
  id: '4e374320-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 751,
  amount: 90
});

exports.MockOrders = orders;
