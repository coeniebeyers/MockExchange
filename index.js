var spawn = require('child_process').spawn;
var child = spawn('node', ['orderLog.js']);  

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

var maxEmitTime = 0;
var avgEmitTime = 0;

var maxOrderCreationTime = 0;
var avgOrderCreationTime = 0;

var maxOps = 0;
var avgOps = 0;

var orderCount = 0;
var startTime = 0;

events.on('displayStats', function(){
  console.log('---');
  console.log('maxOrderCreationTime:', maxOrderCreationTime, 'ms');
  console.log('avgOrderCreationTime:', avgOrderCreationTime, 'ms');
  console.log('maxEmitTime:', maxEmitTime, 'ms');
  console.log('avgEmitTime:', avgEmitTime, 'ms');
  console.log('avgOps:', avgOps);
  console.log('bids.length:', bids.length);
  console.log('asks.length:', asks.length);
});

var bids = [];
var asks = [];

events.on('newOrder', function(order){
  var arrivalTime = new Date().getTime();
  orderCount++;

  var orderCreationTime = arrivalTime - order.timestamp;
  var emitTime = arrivalTime - order.orderEmitTime;

  // Order creation
  var orderTimeDiff = orderCreationTime - avgOrderCreationTime;
  avgOrderCreationTime += orderTimeDiff/orderCount;
  if(orderCreationTime > maxOrderCreationTime){
    maxOrderCreationTime = orderCreationTime;
  }
  // Event emitter
  var emitTimeDiff = emitTime - avgEmitTime;
  avgEmitTime += emitTimeDiff/orderCount;
  if(emitTime > maxEmitTime){
    maxEmitTime = emitTime;
  }
  // Operation processing
  var elapsedStartTime = (arrivalTime - startTime)/1000;
  avgOps = orderCount/elapsedStartTime; 

  //console.log('---\norder:', order);
  updateOrderBook(order);
  //events.emit('displayOrderBook');
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
      } else if (asks[0].amount == order.amount) { 
        var match = {
          order1: asks[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        asks[0].amount -= order.amount;
        asks.splice(0, 1);
      } else {
        var match = {
          order1: asks[0],
          order2: order,
          amount: asks[0].amount
        };
        events.emit('matched', match);
        order.amount -= asks[0].amount;
        asks.splice(0, 1);
        updateOrderBook(order);
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
      } else if (bids[0].amount == order.amount){
        var match = {
          order1: bids[0],
          order2: order,
          amount: order.amount
        };
        events.emit('matched', match);
        bids[0].amount -= order.amount;
        bids.splice(0, 1);
      } else {
        var match = {
          order1: bids[0],
          order2: order,
          amount: bids[0].amount
        };
        events.emit('matched', match);
        order.amount -= bids[0].amount;
        bids.splice(0, 1);
        updateOrderBook(order);
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
  var amount = (Math.floor((Math.random() * 1000) + 1))/100;
  return {price: price, amount: amount};
}

// Assume just one currency pair right now, BTCUSD
function createOrder(cb){
  var orderTimestamp = new Date().getTime();  
  var orderId = uuid.v1();
  var bidOrAsk = getBidOrAsk();
  var offer = getOffer();
  var order = {
    timestamp: orderTimestamp,
    id: orderId,
    type: bidOrAsk,
    price: offer.price,
    amount: offer.amount
  };
  cb(order);
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
    type: bidOrAsk,
    orderToCancel: orderToCancel,
  };
  cb(order);
}

events.on('matched', function(match){
  child.stdin.write('\n'); 
  child.stdin.write(JSON.stringify(match)); 
  child.stdin.write('\n'); 
  //orderLog.AddLog(order, function(res){
  //});
});

function createNewOrders(){
  setInterval(function(){
    for(var i = 0; i < 10; i++){
      createOrder(function(order){
        order.orderEmitTime = new Date().getTime(),
        events.emit('newOrder', order);
      });
    }
  }, 1);  
}

function createCancelOrders(){
  setInterval(function(){
    if(bids.length > 1 && asks.length > 1){
      for(var i = 0; i < 9; i++){
        createCancelOrder(function(order){
          order.orderEmitTime = new Date().getTime(),
          events.emit('newOrder', order);
        });
      }
    }
  }, 1);  
}

function run(){

  setInterval(function(){
    events.emit('displayStats');
  }, 1000);

  /*setInterval(function(){
    events.emit('displayOrderBook');
  }, 1000);*/

  if(startTime == 0){
    startTime = new Date().getTime();
  }

  createNewOrders();
  createCancelOrders();
}

run();

