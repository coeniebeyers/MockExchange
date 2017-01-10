var async = require('async');
//var spawn = require('child_process').spawn;
//var child = spawn('node', ['../DB/orderLog.js']);  
var events = require('./eventEmitter.js');
var config = require('../config.js');
var util = require('../util.js');

var orderLog;
var accounts;

var avgOps = 0;
var orderCount = 0;
var matchedTrades = 0;
var startTime = new Date().getTime();
var lastTraded = null;

// Asks: willing to sell currency1 for currency2
var asks = [];
// Bids: willing to buy currency1 with currency2
var bids = [];

/*child.stderr.on('data', function(data){
  console.log('err data:');
  console.log(data.toString());
  console.log('end of err data');
});

child.stdout.setEncoding('utf8');
child.stdout.on('data', function(data){
  console.log('Child response:', data);
});*/

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

events.on('newOrder', function(order){
  var arrivalTime = new Date().getTime();
  orderCount++;
  // Operation processing
  var elapsedStartTime = (arrivalTime - startTime)/1000;
  avgOps = orderCount/elapsedStartTime; 

  updateOrderBook(order);
  accounts.UpdateReserveAmounts(order);
});

function handleBid(order){
  order.amount = util.Round(order.amount, config.currency1.constant);
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
      asks[0].amount = util.Round(asks[0].amount, config.currency1.constant);
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
      newOrder.amount = util.Round(newOrder.amount, config.currency1.constant);
      newOrder.parentOrder = order;
      asks.splice(0, 1);
      events.emit('matchExecuted', match);
      updateOrderBook(newOrder);
    }
  }
}

function handleAsk(order){
  order.amount = util.Round(order.amount, config.currency1.constant);
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
      bids[0].amount = util.Round(bids[0].amount, config.currency1.constant);
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
      newOrder.amount = util.Round(newOrder.amount, config.currency1.constant);
      newOrder.parentOrder = order;
      bids.splice(0, 1);
      events.emit('matchExecuted', match);
      updateOrderBook(newOrder);
    }
  }
}

function updateOrderBook(order){
  if(order.type == 'bid'){
    handleBid(order);
  } else if(order.type == 'ask'){ // order.type ask
    handleAsk(order);
  } else if(order.type == 'cancelbid'){
    var i = getIndex(0, bids.length-1, bids, order, 'desc');
    if(i !== null){
      bids.splice(i, 1);
    }
  } else if(order.type == 'updatebid'){
    var i = getIndex(0, bids.length-1, bids, order, 'desc');
    if(i !== null && bids[i] !== undefined){
      bids[i].amount = order.amount;
      bids[i].amount = util.Round(bids[i].amount, config.currency2.constant);
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
      asks[i].amount = util.Round(asks[i].amount, config.currency1.constant);
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

events.on('matched', function(match){
  //auditTotals();
});

// This hands the logging of matched order to the child thread
events.on('matchExecuted', function(match){
  /*child.stdin.write('\n'); 
  child.stdin.write(JSON.stringify(match)); 
  child.stdin.write('\n');*/
  orderLog.AddLog(match);
});

events.on('matchExecuted', function(match){
  accounts.UpdateAccountBalances(match);
  //accounts.AuditTotals();
});

events.on('matchExecuted', function(match){
  matchedTrades++;
});

events.on('orderExecuted', function(order){
  var bidsAndAsks = bids.concat(asks);
  accounts.AuditOrdersToReservedBalances(bidsAndAsks);
});

events.on('matchExecuted', function(match){
  lastTraded = {
    price: match.order1.price,
    amount: match.amount
  };
});

// Assume just one currency pair right now, BTCUSD
function submitNewOrderForMatching(newOrderFromUI, cb){
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
  events.emit('newOrder', newOrderFromUI);
  cb({submitted: true});
}

module.exports = function(modules){

  orderLog = modules.orderLog;
  accounts = require('./accountManagement.js')(modules);

  var functions = {};

  functions.SubmitNewOrderForMatching = submitNewOrderForMatching;
  functions.GetStats = getStats;
  functions.GetBidsAndAsks = getBidsAndAsks;
  functions.GetLastTrade = getLastTrade;
  return functions;
};

