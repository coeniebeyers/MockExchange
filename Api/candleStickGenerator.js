var orderLog = require('../DB/orderLog.js');
var candlestickCache = require('../DB/candlestickCache.js');

function calculateNumberOfCandles(startTime, endTime, candleSize){
 return Math.ceil((endTime - startTime)/candleSize);
}

function subtractSeconds(endDate, secondsToSubtract) {
  var startDate = new Date(endDate); 
	startDate.setTime(startDate.getTime() - secondsToSubtract*1000);
  return startDate.getTime();
}

function setLastBucketParameters(noMinutes, candleSize, endOfSecondLastCandlestick){
  var noGraphIntervals = 50;
  var noSecondsToQuery = noGraphIntervals * 60 * noMinutes;  
  candleSize = candleSize * noMinutes;
  if(noMinutes<60){
    var mn = endOfSecondLastCandlestick.getMinutes();
    var mn = parseInt(mn / noMinutes, noMinutes) * noMinutes;
    endOfSecondLastCandlestick.setMinutes(mn);
  }
  if(noMinutes>=60){
    endOfSecondLastCandlestick.setMinutes(0);
  }
  if(noMinutes>=(60*24)){
    endOfSecondLastCandlestick.setHours(0);
  }
  
  return {noSecondsToQuery: noSecondsToQuery, endOfSecondLastCandlestick: endOfSecondLastCandlestick, candleSize: candleSize};
}

function getCandleStickData(interval, cb){
  var noSecondsToQuery = 0;
  var trades = [];
  var endOfSecondLastCandlestick = new Date();
  endOfSecondLastCandlestick.setSeconds(0, 0);
  var candleSize = 60000;
  var lastBucketParameters = {noSecondsToQuery: noSecondsToQuery, endOfSecondLastCandlestick: endOfSecondLastCandlestick, candleSize: candleSize};
  switch(interval.toLowerCase()) {
    case 'day'    :  {
      lastBucketParameters = setLastBucketParameters(60*24, candleSize, endOfSecondLastCandlestick);
      break;
    }
    case 'hour'   :  {
      lastBucketParameters = setLastBucketParameters(60, candleSize, endOfSecondLastCandlestick);
      break;
    }
    case '5 minute' :  {
      lastBucketParameters = setLastBucketParameters(5, candleSize, endOfSecondLastCandlestick);
      break;
    }
    case '15 minute' :  {
      lastBucketParameters = setLastBucketParameters(15, candleSize, endOfSecondLastCandlestick);
      break;
    }
    case 'minute' :  {
      lastBucketParameters = setLastBucketParameters(1, candleSize, endOfSecondLastCandlestick);
      break;
    }
    default       :  {
      lastBucketParameters = setLastBucketParameters(1, candleSize, endOfSecondLastCandlestick);
      break;
    }
  }

  endOfSecondLastCandlestick = lastBucketParameters.endOfSecondLastCandlestick;
  noSecondsToQuery = lastBucketParameters.noSecondsToQuery;
  candleSize = lastBucketParameters.candleSize;

  endOfSecondLastCandlestick = endOfSecondLastCandlestick.getTime();
  
  var startTime = subtractSeconds(endOfSecondLastCandlestick, noSecondsToQuery);
  var endTime = Date.now();

  //First check to see if the previous candlesticks are cached

  candlestickCache.FetchCandlesticks(startTime, endOfSecondLastCandlestick, interval, function(candlesticks){
    if(candlesticks){
      console.log('if we are getting to this point, something has gone wrong');
    } else {
      orderLog.FetchLog(startTime, endTime, function(docs){
        for(index in docs){
          trades.push({
            timestamp: docs[index].order2.timestamp,
            amount: docs[index].amount,
            price: docs[index].order1.price
          });
        }

        getOHLCCandles(startTime, endTime, trades, candleSize, function(candles){
          cb(candles);
        });	
      });
    }
  });
}

// Candle size in seconds
function getOHLCCandles(startTime, endTime, tradeList, candleSize, cb){
  var endOfCurrentCandle = startTime + candleSize;
  var numberOfCandles = calculateNumberOfCandles(startTime, endTime, candleSize);

  var trade = { timestamp: startTime, amount: 0, price: 0 };
  var tradeListIndex = 0;
  if(tradeList.length>0){
    trade = tradeList[tradeListIndex];
  }
  var candleList = [];
  var close = 0;

  for(var i = 0; i < numberOfCandles; i++){
   endOfCurrentCandle = startTime + (i + 1)*candleSize;
   var d = new Date(endOfCurrentCandle);
   var endOfCurrentCandleTime = (d.getHours()<10?'0':'') + d.getHours() + ':' + (d.getMinutes()<10?'0':'') + d.getMinutes();
   if(!tradeList || tradeList.length==0 || tradeList[tradeListIndex].timestamp > endOfCurrentCandle){
     var emptyCandleInfo = {
       open: close,
       high: close,
       low: close,
       close: close,
       volume: 0,
       endOfCurrentCandle: endOfCurrentCandle,
       endOfCurrentCandleTime: endOfCurrentCandleTime
     };
     candleList.push(emptyCandleInfo);    
   } else {
     var open = Number(trade.price);
     if(candleList.length > 0 && trade.timestamp > endOfCurrentCandle){
       open = candleList[candleList.length-1].close;   
     }
     var high = open;
     var low = open;
     close = open;
     var volume = 0;

     for(;trade && trade.timestamp <= endOfCurrentCandle && tradeListIndex < (tradeList.length-1);){
       var tradePrice = Number(trade.price);
       if(tradePrice > high){
         high = tradePrice;
       }  
       if(tradePrice < low){
         low = tradePrice;
       }
       volume += Number(trade.amount);

       if(tradeListIndex < (tradeList.length-1)){
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
       endOfCurrentCandle: endOfCurrentCandle,
       endOfCurrentCandleTime: endOfCurrentCandleTime
     };
     candleList.push(candleInfo);    
   }
  }
  cb(candleList);
}

exports.GetCandleStickData = getCandleStickData;
