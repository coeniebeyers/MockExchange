var orders = [];

var accountId = 0;
var timestamp = 1481536182349;

orders.push({
  timestamp: timestamp++,
  id: '4e367fd0-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 750,
  amount: 100
});
orders.push({
  timestamp: timestamp++,
  id: '4e374320-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 751,
  amount: 100
});
orders.push({
  timestamp: timestamp++,
  id: '4e374323-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 751,
  amount: 90
});
orders.push({
  timestamp: timestamp++,
  id: '4e374321-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 750,
  amount: 90
});
orders.push({
  timestamp: timestamp++,
  id: '4e374324-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 751,
  amount: 50
});
orders.push({
  timestamp: timestamp++,
  id: '4e374325-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 752,
  amount: 50
});
orders.push({
  timestamp: timestamp++,
  id: '4e374326-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'ask',
  price: 752,
  amount: 50
});
orders.push({
  timestamp: timestamp++,
  id: '4e374327-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 751,
  amount: 50
});
orders.push({
  timestamp: timestamp++,
  id: '4e374328-c050-11e6-992a-730712547a2a',
  accountId: accountId,
  type: 'bid',
  price: 751,
  amount: 50
});

exports.MockOrders = orders;
