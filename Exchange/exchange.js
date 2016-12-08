var async = require('async');
var spawn = require('child_process').spawn;
var child = spawn('node', ['../DB/orderLog.js']);  
var orderLog = require('../DB/orderLog.js');
var events = require('./eventEmitter.js');

var avgOps = 0;
var orderCount = 0;
var matchedTrades = 0;
var startTime = 0;
var lastTraded = null;

// Asks: willing to sell currency1 for currency2
var asks = [];
// Bids: willing to buy currency1 with currency2
var bids = [];


var config = {
  currency1: {
    name: 'BTC',
    decimals: 10,
    constant: Math.pow(10, 10)
  },
  currency2: {
    name: 'USD',
    decimals: 4,
    constant: Math.pow(10, 4)
  }
};

child.stderr.on('data', function(data){
  console.log('err data:');
  console.log(data.toString());
  console.log('end of err data');
});

child.stdout.setEncoding('utf8');
child.stdout.on('data', function(data){
  console.log('Child response:', data);
});

function getLastTrade(cb){
  if(lastTraded){
    lastTraded.price = Number(lastTraded.price).toFixed(2);
    lastTraded.amount = Number(lastTraded.amount).toFixed(0);
  }
  cb(lastTraded);
}

function getBidsAndAsks(maxNo, cb){
  var bidsAndAsks = {
    bids : bids.slice(0,maxNo),
    asks : asks.slice(0,maxNo)
  };

  for(var index in bidsAndAsks.bids){
    bidsAndAsks.bids[index].price = Number(bidsAndAsks.bids[index].price).toFixed(2);
    bidsAndAsks.bids[index].amount = Number(bidsAndAsks.bids[index].amount).toFixed(0);
  }

  for(var index in bidsAndAsks.asks){
    bidsAndAsks.asks[index].price = Number(bidsAndAsks.asks[index].price).toFixed(2);
    bidsAndAsks.asks[index].amount = Number(bidsAndAsks.asks[index].amount).toFixed(0);
  }

  cb(bidsAndAsks);
}

function getStats(cb){
  var stats = {
    avgOps : avgOps,
    matchedTrades : matchedTrades,
    bidsLength : bids.length,
    asksLength : asks.length,
    lastTrade : lastTraded 
  };

  cb(stats);
}

events.on('displayStats', function(){
  console.log('---');
  getStats(function(stats){
    console.log(stats);
  });
});

function round(number, constant){
  return Math.round(number*constant)/constant;
  //return Number((Math.round(number*constant)/constant).toFixed(4));
  //return number;
}

// Update amounts reserved 
events.on('newOrder', function(order){
  var account = accountList[order.accountId];
  if(order.type == 'ask'){
    var amount = order.amount;
    account.reservedCurrency1 += amount;
    account.reservedCurrency1 = round(account.reservedCurrency1, config.currency1.constant);
  } else if(order.type == 'cancelask'){
    var amount = order.amount;
    account.reservedCurrency1 -= amount;
    account.reservedCurrency1 = round(account.reservedCurrency1, config.currency1.constant);
  } else if(order.type == 'updateask'){
    var amount = order.amount;
    account.reservedCurrency1 += amount;
    account.reservedCurrency1 = round(account.reservedCurrency1, config.currency1.constant);
  } else if(order.type == 'bid'){
    var amount = order.amount * order.price;
    account.reservedCurrency2 += amount;
    account.reservedCurrency2 = round(account.reservedCurrency2, config.currency2.constant);
  } else if(order.type == 'cancelbid'){
    var amount = order.amount * order.price;
    account.reservedCurrency2 -= amount;
    account.reservedCurrency2 = round(account.reservedCurrency2, config.currency2.constant);
  } else if(order.type == 'updatebid'){
    var amount = order.amount * order.price;
    account.reservedCurrency2 += amount;
    account.reservedCurrency2 = round(account.reservedCurrency2, config.currency2.constant);
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
    order.amount = round(order.amount, config.currency1.constant);
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
        asks[0].amount = round(asks[0].amount, config.currency1.constant);
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else if (asks[0].amount == order.amount) { 
        var match = {
          order1: asks[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
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
        newOrder.amount = round(newOrder.amount, config.currency1.constant);
        newOrder.parentOrder = order;
        asks.splice(0, 1);
        events.emit('matchExecuted', match);
        updateOrderBook(newOrder);
      }
    }
  } else if(order.type == 'ask'){ // order.type ask
    order.amount = round(order.amount, config.currency1.constant);
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
        bids[0].amount = round(bids[0].amount, config.currency1.constant);
        events.emit('matchExecuted', match);
        events.emit('orderExecuted', order);
      } else if (bids[0].amount == order.amount){
        var match = {
          order1: bids[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
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
        newOrder.amount = round(newOrder.amount, config.currency1.constant);
        newOrder.parentOrder = order;
        bids.splice(0, 1);
        events.emit('matchExecuted', match);
        updateOrderBook(newOrder);
      }
    }
  } else if(order.type == 'cancelbid'){
    var i = getIndex(0, bids.length-1, bids, order, 'desc');
    if(i !== null){
      bids.splice(i, 1);
    }
  } else if(order.type == 'updatebid'){
    var i = getIndex(0, bids.length-1, bids, order, 'desc');
    if(i !== null && bids[i] !== undefined){
      bids[i].amount = order.amount;
      bids[i].amount = round(bids[i].amount, config.currency2.constant);
    }
  } else if(order.type == 'cancelask'){
    var i = getIndex(0, asks.length-1, asks, order, 'asc');
    if(i !== null){
      asks.splice(i, 1);
    }
  } else if(order.type == 'updateask'){
    var i = getIndex(0, asks.length-1, asks, order, 'asc');
    if(i !== null && asks[i] !== undefined){
      asks[i].amount = order.amount;
      asks[i].amount = round(asks[i].amount, config.currency1.constant);
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
      //console.log('1) Not found:', order);
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
    //console.log('2) Not found:', order);
    return null;
  }
}

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
  //auditTotals();
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
    var account1 = accountList[match.order1.accountId];
    account1.currency1 -= currency1Amount;
    account1.currency1 = round(account1.currency1, config.currency1.constant);
    account1.reservedCurrency1 -= currency1Amount;
    account1.reservedCurrency1 = round(account1.reservedCurrency1, config.currency1.constant);
    account1.currency2 += currency2Amount;
    account1.currency2 = round(account1.currency2, config.currency2.constant);

    var account2 = accountList[match.order2.accountId];
    account2.currency1 += currency1Amount;
    account2.currency1 = round(account2.currency1, config.currency1.constant);
    account2.currency2 -= currency2Amount;
    account2.currency2 = round(account2.currency2, config.currency2.constant);
    account2.reservedCurrency2 -= match.order2.price*currency1Amount;
    account2.reservedCurrency2 = round(account2.reservedCurrency2, config.currency2.constant);
  } else if(match.order1.type == 'bid') { 
    var account1 = accountList[match.order1.accountId];
    account1.currency1 += currency1Amount;
    account1.currency1 = round(account1.currency1, config.currency1.constant);

    account1.currency2 -= currency2Amount;
    account1.currency2 = round(account1.currency2, config.currency2.constant);

    account1.reservedCurrency2 -= currency2Amount;
    account1.reservedCurrency2 = round(account1.reservedCurrency2, config.currency2.constant);

    var account2 = accountList[match.order2.accountId];
    account2.currency1 -= currency1Amount;
    account2.currency1 = round(account2.currency1, config.currency1.constant);

    account2.reservedCurrency1 -= currency1Amount;
    account2.reservedCurrency1 = round(account2.reservedCurrency1, config.currency1.constant);
    
    account2.currency2 += currency2Amount;
    account2.currency2 = round(account2.currency2, config.currency2.constant);
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
  for(var i=accountList.length; i--;){
    totalCurrency1 += accountList[i].currency1;
    totalCurrency1 = round(totalCurrency1, config.currency1.constant);
    totalCurrency2 += accountList[i].currency2; 
    totalCurrency2 = round(totalCurrency2, config.currency2.constant);
  }  

  var totalDeposited1 = accountBalance*accountList.length;
  var totalDeposited2 = accountBalance*accountList.length;
  var diffCurrency1 = Math.abs(totalCurrency1 - totalDeposited1);
  var diffCurrency2 = Math.abs(totalCurrency2 - totalDeposited2);

  /*
  if(Number(diffCurrency1) > 0 || Number(diffCurrency2) > 0){
    console.log('ERROR: Audited totals: '+'\nBTC: '+totalCurrency1+'\nUSD: '+totalCurrency2);
  }
  */
}

var accountList = [];
var accountBalance = 100;

function createAccounts(){
  for(var i = 0; i < 10000; i++){
    accountList.push({
      currency1: accountBalance,
      reservedCurrency1: 0,
      currency2: accountBalance,
      reservedCurrency2: 0,
      id: i 
    });
  }
}

function calculateOpenInterest(){
  var accountOrders = [];
  // Get open orders for account
  var bidsAndAsks = bids.concat(asks);
  var totalCurrency1 = 0;
  var totalCurrency2 = 0;    
  for(var i=bidsAndAsks.length; i--;){
    var order = bidsAndAsks[i];
    if(order.type == 'ask'){
      if(accountOrders[order.accountId] == undefined){
        accountOrders[order.accountId] = 
          {
            currency1: order.amount,
            currency2: 0
          };
      } else {
        accountOrders[order.accountId].currency1 += order.amount;
      }
      accountOrders[order.accountId].currency1 = 
        round(accountOrders[order.accountId].currency1, config.currency1.constant);
    } else if(order.type == 'bid'){
      if(accountOrders[order.accountId] == undefined){
        var currency2 = order.amount * order.price;
        accountOrders[order.accountId] = 
          {
            currency1: 0,
            currency2: currency2
          };
      } else {
        accountOrders[order.accountId].currency2 += order.amount * order.price;
      }
      accountOrders[order.accountId].currency2 = 
        round(accountOrders[order.accountId].currency2, config.currency2.constant);
    }
  }
  return accountOrders;
}

function auditOrdersToReservedBalances(){
  var accountOrders = calculateOpenInterest();
  for(var accountId = accountList.length; accountId--;){
    if(accountOrders[accountId] !== undefined){
      var totalCurrency1 = accountOrders[accountId].currency1;
      var totalCurrency2 = accountOrders[accountId].currency2;
      var account = accountList[accountId];
      var reservedCurrency1 = account.reservedCurrency1;
      var reservedCurrency2 = account.reservedCurrency2;

      /*
      if(Math.abs(totalCurrency1-reservedCurrency1) > 0 
          || Math.abs(totalCurrency2-reservedCurrency2) > 0){
        console.log('ERROR: Mismatch between open orders and reserved balance for account:', 
          accountId);
        console.log('totalCurrency1:', totalCurrency1);
        console.log('account.reservedCurrency1:', reservedCurrency1);
        console.log('totalCurrency2:', totalCurrency2);
        console.log('account.reservedCurrency2:', reservedCurrency2);
      }
      */
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

// Assume just one currency pair right now, BTCUSD
  // TODO: this needs to move to a place where account balances are checked before the order is 
  // allowed on the orderbook
  /*if(order.type == 'ask' && order.amount > (account.currency1 - account.reservedCurrency1)){
    cb(null); 
  } else if(order.type == 'bid' 
      && (order.amount*order.price) > (account.currency2 - account.reservedCurrency2)){
    cb(null)
  } else {
    cb(order);
  }*/

function startExchangeSimulation(){

  setInterval(function(){
    events.emit('displayStats');
  }, 1000);

  /*setInterval(function(){
    console.log('---');
    for(var i in accountList){
      displayAccountInformation(i);
    }
  }, 1000);*/

  if(startTime == 0){
    startTime = new Date().getTime();
  }
  createAccounts();
}

function submitNewOrderForMatching(newOrderFromUI, cb){
  events.emit('newOrder', newOrderFromUI);
  cb({submitted: true});
}

exports.SubmitNewOrderForMatching = submitNewOrderForMatching;
exports.StartExchangeSimulation = startExchangeSimulation;
exports.GetStats = getStats;
exports.GetBidsAndAsks = getBidsAndAsks;
exports.GetLastTrade = getLastTrade;
