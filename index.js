var async = require('async');
var spawn = require('child_process').spawn;
var child = spawn('node', ['orderLog.js']);  

var config = {
  currency1: {
    name: 'BTC',
    decimals: 8
  },
  currency2: {
    name: 'USD',
    decimals: 2
  }
}

child.stderr.on('data', function(data){
  console.log('err data:');
  console.log(data.toString());
  console.log('end of err data');
});

child.stdout.setEncoding('utf8');
child.stdout.on('data', function(data){
  console.log('Child response:', data);
});

var orderLog = require('./orderLog.js');
var events = require('./eventEmitter.js');
var uuid = require('uuid');

var avgOps = 0;

var orderCount = 0;
var matchedTrades = 0;
var startTime = 0;

// Asks: willing to sell currency1 for currency2
var asks = [];
// Bids: willing to buy currency1 with currency2
var bids = [];

var lastTraded = null;

events.on('displayStats', function(){
  console.log('---');
  console.log('avgOps:', avgOps);
  console.log('matched trades:', matchedTrades);
  console.log('bids.length:', bids.length);
  console.log('asks.length:', asks.length);
  console.log('last trade:', lastTraded); 
});

// Update amounts reserved 
events.on('newOrder', function(order){
  var account = accountList[order.accountId];
  if(order.type == 'ask'){
    var amount = order.amount;
    account.reservedCurrency1 += amount;
  } else if(order.type == 'cancelask'){
    var amount = order.amount;
    account.reservedCurrency1 -= amount;
  } else if(order.type == 'bid'){
    var amount = order.amount * order.price;
    account.reservedCurrency2 += amount;
  } else if(order.type == 'cancelbid'){
    var amount = order.amount * order.price;
    account.reservedCurrency2 -= amount;
  }
});

events.on('newOrder', function(order){
  var arrivalTime = new Date().getTime();
  orderCount++;
  // Operation processing
  var elapsedStartTime = (arrivalTime - startTime)/1000;
  avgOps = orderCount/elapsedStartTime; 

  updateOrderBook(order);
});

function updateOrderBook(order){
  if(order.type == 'bid'){
    // No matching asks
    if((asks.length == 0)||(asks.length > 0 && order.price < asks[0].price)){ 
      if(bids.length == 0 || order.price > bids[0].price){ // Update first element in list
        bids.splice(0, 0, order);
      } else {
        var i = getPosition(0, bids.length-1, bids, order, 'desc');
        bids.splice(i, 0, order);
      }
    } else { // This bid matches with an ask
      if(asks[0].amount > order.amount){
        var match = {
          order1: asks[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        asks[0].amount -= order.amount;
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else if (asks[0].amount == order.amount) { 
        var match = {
          order1: asks[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        asks[0].amount -= order.amount;
        asks.splice(0, 1);
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else {
        var match = {
          order1: asks[0],
          order2: order,
          amount: asks[0].amount
        };
        events.emit('matched', match);
        var newOrder = Object.assign({}, order); 
        newOrder.amount -= asks[0].amount;
        newOrder.parentOrder = order;
        asks.splice(0, 1);
        events.emit('matchExecuted', match);
        updateOrderBook(newOrder);
      }
    }
  } else if(order.type == 'ask'){ // order.type ask
    // No matching bids
    if((bids.length == 0)||(bids.length > 0 && order.price > bids[0].price)){
      if(asks.length == 0 || order.price < asks[0].price){ // Update first element in list
        asks.splice(0, 0, order);
      } else {
        var i = getPosition(0, asks.length-1, asks, order, 'asc');
        asks.splice(i, 0, order);
      }
    } else { // This ask matches with a bid
      if(bids[0].amount > order.amount){
        var match = {
          order1: bids[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        bids[0].amount -= order.amount;
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else if (bids[0].amount == order.amount){
        var match = {
          order1: bids[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        bids[0].amount -= order.amount;
        bids.splice(0, 1);
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else {
        var match = {
          order1: bids[0],
          order2: order,
          amount: bids[0].amount
        };
        events.emit('matched', match);
        var newOrder = Object.assign({}, order); 
        newOrder.amount -= bids[0].amount;
        newOrder.parentOrder = order;
        bids.splice(0, 1);
        events.emit('matchExecuted', match);
        updateOrderBook(newOrder);
      }
    }
  } else if(order.type == 'cancelbid'){
    var i = getIndex(0, bids.length-1, bids, order.orderToCancel, 'desc');
    if(i){
      bids.splice(i, 1);
    }
  } else if(order.type == 'cancelask'){
    var i = getIndex(0, asks.length-1, asks, order.orderToCancel, 'asc');
    if(i){
      asks.splice(i, 1);
    }
  }
}

function getPosition(startIndex, endIndex, array, order, direction){
  var middleIndex = Math.floor((startIndex+endIndex)/2);
  //console.log(startIndex+', '+endIndex+', '+order.price+', '+array[middleIndex].price);
  if(endIndex-startIndex <= 1){
    if(direction == 'desc' && array[endIndex].price > order.price){
      return endIndex+1;
    } else if(direction == 'desc' && array[endIndex].price < order.price){
      return endIndex;
    } else if(direction == 'asc' && array[endIndex].price < order.price){
      return endIndex+1;
    } else if(direction == 'asc' && array[endIndex].price > order.price){
      return endIndex;
    } else if(array[endIndex].price = order.price){
      var i = 1;
      while((endIndex+i) < array.length && array[endIndex+i].price == order.price){
        i++;
      }
      return endIndex+i;
    } else { 
      console.log('1) Position not found');
      return null;
    }
  } else if(direction == 'desc' && array[middleIndex].price < order.price){ // bids
    return getPosition(startIndex, middleIndex, array, order, direction);
  } else if(direction == 'desc' && array[middleIndex].price > order.price){ // bids
    return getPosition(middleIndex, endIndex, array, order, direction);
  } else if(direction == 'asc' && array[middleIndex].price > order.price){ // asks
    return getPosition(startIndex, middleIndex, array, order, direction);
  } else if(direction == 'asc' && array[middleIndex].price < order.price){ // asks
    return getPosition(middleIndex, endIndex, array, order, direction);
  } else if(array[middleIndex].price = order.price){
    var i = 1;
    while((middleIndex+i) < array.length && array[middleIndex+i].price == order.price){
      i++;
    }
    return middleIndex+i;
  } else { 
    console.log('2) Position not found');
    return null;
  }
}

function getIndex(startIndex, endIndex, array, order, direction){
  var middleIndex = Math.floor((startIndex+endIndex)/2);
  if((endIndex-startIndex <= 1) || array[middleIndex].id == order.id){
    if(array[startIndex].id == order.id){
      return startIndex;
    } else if(array[endIndex].id == order.id){
      return endIndex;
    } else if(array[middleIndex].id == order.id){
      return middleIndex;
    } else {
      console.log('1) Not found:', order);
      return null;
    }
  } else if(direction == 'desc' && array[middleIndex].price < order.price){ // bids
    return getIndex(startIndex, middleIndex, array, order, direction);
  } else if(direction == 'desc' && array[middleIndex].price > order.price){ // bids
    return getIndex(middleIndex, endIndex, array, order, direction);
  } else if(direction == 'asc' && array[middleIndex].price > order.price){ // asks
    return getIndex(startIndex, middleIndex, array, order, direction);
  } else if(direction == 'asc' && array[middleIndex].price < order.price){ // asks
    return getIndex(middleIndex, endIndex, array, order, direction);
  } else if (array[middleIndex].price == order.price && array[middleIndex].id != order.id){
    var i = 1;
    var j = 1;
    while(((middleIndex+i < array.length)&&(array[middleIndex+i].price == order.price))
      || ((middleIndex-j >= 0)&&(array[middleIndex-j].price == order.price))){
      if(array[middleIndex+i].id == order.id){
        return middleIndex+i;
      } else if (array[middleIndex-j].id == order.id){
        return middleIndex-j;
      }
      i++;
      j++;
    }
    console.log('2) Not found:', order);
    return null;
  }
}

events.on('displayOrderBook', function(){
  displayOrderBook();
});

function displayOrderBook(){
  console.log();
  console.log('OrderBook:');
  for(var i = asks.length-1; i >= 0; i--){
    console.log(asks[i].price + ' | ' + asks[i].amount);
  }
  console.log('-');
  for(var j = 0; j < bids.length; j++){
    console.log(bids[j].price + ' | ' + bids[j].amount);
  }
}

events.on('matched', function(match){
  auditTotals();
  /*console.log('--- matched');
  var openInterest1 = calculateOpenInterest(match.order1.accountId);
  console.log('openInterest1:', openInterest1);
  displayAccountInformation(match.order1.accountId);

  var openInterest2 = calculateOpenInterest(match.order2.accountId);
  console.log('openInterest2:', openInterest2);
  displayAccountInformation(match.order2.accountId);
  console.log('match:', match); */
});

// This hands the logging of matched order to the child thread
events.on('matchExecuted', function(match){
  child.stdin.write('\n'); 
  child.stdin.write(JSON.stringify(match)); 
  child.stdin.write('\n'); 
});

events.on('matchExecuted', function(match){
  matchedTrades++;
});

events.on('matchExecuted', function(match){
  updateAccountBalances(match);
  auditTotals();
  /*console.log('--- matchExecuted');
  displayAccountInformation(match.order1.accountId);
  displayAccountInformation(match.order2.accountId);*/
});

events.on('orderExecuted', function(order){
  auditOrdersToReservedBalances();
});

function updateAccountBalances(match){
  var currency1Amount = match.amount;
  //console.log('currency1Amount:', currency1Amount);
  var currency2Amount = match.order1.price * currency1Amount;
  //console.log('currency2Amount:', currency2Amount);
  if(match.order1.type == 'ask'){
    accountList[match.order1.accountId].currency1 -= currency1Amount;
    accountList[match.order1.accountId].reservedCurrency1 -= currency1Amount;
    accountList[match.order1.accountId].currency2 += currency2Amount;

    accountList[match.order2.accountId].currency1 += currency1Amount;
    accountList[match.order2.accountId].currency2 -= currency2Amount;
    accountList[match.order2.accountId].reservedCurrency2 -= (match.order2.price*currency1Amount);
  } else if(match.order1.type == 'bid') { 
    accountList[match.order1.accountId].currency1 += currency1Amount;
    accountList[match.order1.accountId].currency2 -= currency2Amount;
    accountList[match.order1.accountId].reservedCurrency2 -= currency2Amount;

    accountList[match.order2.accountId].currency1 -= currency1Amount;
    accountList[match.order2.accountId].reservedCurrency1 -= currency1Amount;
    accountList[match.order2.accountId].currency2 += currency2Amount;
  } 
}

events.on('matchExecuted', function(match){
  lastTraded = {
    price: match.order1.price,
    amount: match.amount
  };
});

function auditTotals(){
  var totalCurrency1 = 0;
  var totalCurrency2 = 0;
  for(var i in accountList){
    var account = accountList[i];
    totalCurrency1 += account.currency1;
    totalCurrency2 += account.currency2; 
  }  

  if(Math.abs(totalCurrency1 - 100*accountList.length) > 1 
      || Math.abs(totalCurrency2 - 100*accountList.length) > 1){
    console.log('ERROR: Audited totals: '+'\nBTC: '+totalCurrency1+'\nUSD: '+totalCurrency2);
  }
}

var accountList = [];
var accountBalance = 100;

function createAccounts(){
  for(var i = 0; i < 5; i++){
    accountList.push({
      currency1: accountBalance,
      reservedCurrency1: 0,
      currency2: accountBalance,
      reservedCurrency2: 0,
      id: i 
    });
  }
}

function getCopyOfAccountOrders(accountId, cb){
  var accountOrders = [];
  var bidsAndAsks = bids.concat(asks);
  for(var i in bidsAndAsks){
    if(bidsAndAsks[i].accountId == accountId){
      accountOrders.push(bidsAndAsks[i]);
    }
  }
  return accountOrders;
}

function calculateOpenInterest(accountId, cb){
  var account = accountList[accountId];
  // Get open orders for account
  accountOrders = getCopyOfAccountOrders(account.id);
  var totalCurrency1 = 0;
  var totalCurrency2 = 0;    
  for(var i in accountOrders){
    var accountOrder = accountOrders[i];
    if(accountOrder.type == 'ask'){
      totalCurrency1 += accountOrder.amount;
    } else if(accountOrder.type == 'bid'){
      totalCurrency2 += (accountOrder.amount * accountOrder.price);
    }
  }
  var obj = {
    totalCurrency1: totalCurrency1, 
    totalCurrency2: totalCurrency2
  };
  return obj;
}

function auditOrdersToReservedBalances(){
  for(var accountId in accountList){
    var openInterest = calculateOpenInterest(accountId)
    var totalCurrency1 = openInterest.totalCurrency1;
    var totalCurrency2 = openInterest.totalCurrency2;
    var account = accountList[accountId];
    var reservedCurrency1 = account.reservedCurrency1;
    var reservedCurrency2 = account.reservedCurrency2;

    if(Math.abs(totalCurrency1-reservedCurrency1) > 0 
        || Math.abs(totalCurrency2-reservedCurrency2) > 0){
      console.log('ERROR: Mismatch between open orders and reserved balance for account:', accountId);
      console.log('totalCurrency1:', totalCurrency1);
      console.log('account.reservedCurrency1:', reservedCurrency1);
      console.log('totalCurrency2:', totalCurrency2);
      console.log('account.reservedCurrency2:', reservedCurrency2);
    } else {
      //console.log('Audit passed');
    }
  }
}

function displayAccountInformation(accountId){
  var account = accountList[accountId];
  console.log('accountNr:', accountId);
  console.log('Balances:');
  console.log('BTC: '+account.currency1+' | USD: '+account.currency2);
  console.log('Reserved balances:');
  console.log('BTC: '+account.reservedCurrency1+' | USD: '+account.reservedCurrency2);
}

function getBidOrAsk(){
  var res = Math.random() >= 0.5;
  if(res){
    return 'bid';
  } else {
    return 'ask';
  }
}

function getOffer(){
  var price = (Math.floor((Math.random() * 1000) + 1))/100;
  var amount = (Math.floor((Math.random() * 100) + 1))/100;
  return {price: price, amount: amount};
}

function getRandomOrder(bidOrAsk){
  if(bidOrAsk == 'bid'){
    var rInt = Math.floor(Math.random() * (bids.length-1));
    return bids[rInt];
  } else if (bidOrAsk == 'ask'){
    var rInt = Math.floor(Math.random() * (asks.length-1));
    return asks[rInt];
  }
}

function createCancelOrder(cb){
  var orderTimestamp = new Date().getTime();  
  var orderId = uuid.v1();
  var bidOrAsk = getBidOrAsk();
  var orderToCancel = getRandomOrder(bidOrAsk);
  bidOrAsk = 'cancel' + bidOrAsk;
  var order = {
    timestamp: orderTimestamp,
    id: orderId,
    accountId: orderToCancel.accountId,
    type: bidOrAsk,
    price: orderToCancel.price,
    amount: orderToCancel.amount,
    orderToCancel: orderToCancel,
  };
  cb(order);
}

// Asks: willing to sell currency1 for currency2
// Bids: willing to buy currency1 with currency2
// Assume just one currency pair right now, BTCUSD
function createOrder(cb){
  // Choose an account
  var accountNr = Math.floor((Math.random() * (accountList.length)) + 0);
  var account = accountList[accountNr];

  var orderTimestamp = new Date().getTime();  
  var orderId = uuid.v1();
  var bidOrAsk = getBidOrAsk();
  var offer = getOffer();
  var order = {
    timestamp: orderTimestamp,
    id: orderId,
    accountId: account.id,
    type: bidOrAsk,
    price: offer.price,
    amount: offer.amount
  };

  if(order.type == 'ask' && order.amount > (account.currency1 - account.reservedCurrency1)){
    cb(null); 
  } else if(order.type == 'bid' 
      && (order.amount*order.price) > (account.currency2 - account.reservedCurrency2)){
    cb(null)
  } else {
    cb(order);
  }
}

function createNewOrders(){
  setInterval(function(){
    for(var i = 0; i < 1; i++){
      createOrder(function(order){
        if(order){
          order.orderEmitTime = new Date().getTime(),
          events.emit('newOrder', order);
        }
      });
    }
  }, 1);  
}

function createCancelOrders(){
  setInterval(function(){
    if(bids.length > 1 && asks.length > 1){
      for(var i = 0; i < 1; i++){
        createCancelOrder(function(order){
          order.orderEmitTime = new Date().getTime(),
          events.emit('newOrder', order);
        });
      }
    }
  }, 1000);  
}

function run(){

  setInterval(function(){
    events.emit('displayStats');
  }, 1000);

  setInterval(function(){
    console.log('---');
    for(var i in accountList){
      displayAccountInformation(i);
    }
  }, 1000);

  if(startTime == 0){
    startTime = new Date().getTime();
  }
  createAccounts();
  createNewOrders();
  //createCancelOrders();
}

run();

