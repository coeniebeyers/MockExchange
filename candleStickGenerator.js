var orderLog = require('./orderLog.js');

function calculateNumberOfCandles(startTime, endTime, candleSize){
 return Math.ceil((endTime - startTime)/candleSize);
}

function getCandleStickData(interval, cb){
  var noSecondsToQuery = 0;
  var noGraphIntervals = 50;
  switch(interval.toLowerCase()) {
    case 'week'   :  noSecondsToQuery = noGraphIntervals * 3600 * 24 * 7;  break;
    case 'day'    :  noSecondsToQuery = noGraphIntervals * 3600 * 24;  break;
    case 'hour'   :  noSecondsToQuery = noGraphIntervals * 3600;  break;
    case 'minute' :  noSecondsToQuery = noGraphIntervals * 60;  break;
    default       :  noSecondsToQuery = noGraphIntervals * 60;  break;
  }

  console.log('noSecondsToQuery: ', noSecondsToQuery);
	orderLog.FetchLog(noSecondsToQuery, function(docs){
		console.log('no orders:', docs.length);

  });
  

}



// Candle size in seconds
function getOHLCCandles(tradeList, candleSize, cb){
 var firstTrade = tradeList[0];
 var lastTrade = tradeList[tradeList.length-1];
 var startTime = firstTrade.timestamp;
 var endTime = lastTrade.timestamp;
 var endOfCurrentCandle = startTime + candleSize;
 var numberOfCandles = calculateNumberOfCandles(startTime, endTime, candleSize);

 var trade = tradeList[0];

 var tradeListIndex = 0;
 var candleList = [];

 for(var i = 0; i < numberOfCandles; i++){
   endOfCurrentCandle = startTime + (i + 1)*candleSize;

   var open = Number(trade.price);
   if(candleList.length > 0 && trade.timestamp > endOfCurrentCandle){
     open = candleList[candleList.length-1].close;   
   }
   var high = open;
   var low = open;
   var close = open;
   var volume = 0;

   for(;trade && trade.timestamp <= endOfCurrentCandle && tradeListIndex < tradeList.length;){
     var tradePrice = Number(trade.price);
     if(tradePrice > high){
       high = tradePrice;
     }  
     if(tradePrice < low){
       low = tradePrice;
     }
     volume += Number(trade.amount);

     if(tradeListIndex < tradeList.length){
       tradeListIndex++;
     }
     trade = tradeList[tradeListIndex];
   }

   close = Number(tradeList[tradeListIndex-1].price);
   
   var candleInfo = {
     open: open,
     high: high,
     low: low,
     close: close,
     volume: volume,
     endOfCurrentCandle: endOfCurrentCandle
   };
   candleList.push(candleInfo);    
 }
 cb(candleList);
}

getCandleStickData('minute');

exports.CalculateNumberOfCandles = calculateNumberOfCandles;
exports.GetOHLCCandles = getOHLCCandles;
