var orderLog = require('../orderLog.js');

function calculateNumberOfCandles(startTime, endTime, candleSize){
 return Math.ceil((endTime - startTime)/candleSize);
}

function subtractSeconds(endDate, secondsToSubtract) {
  var startDate = new Date(endDate); 
	startDate.setTime(startDate.getTime() - secondsToSubtract*1000);
  return startDate.getTime();
}

function getCandleStickData(interval, cb){
  var noSecondsToQuery = 0;
  var noGraphIntervals = 50;
  var trades = [];
  var endTime = new Date();
  endTime.setSeconds(0, 0);
  var candleSize = 60000;

  switch(interval.toLowerCase()) {
    case 'day'    :  {
      noSecondsToQuery = noGraphIntervals * 3600 * 24;  
      endTime.setHours(0);
      candleSize = candleSize * 60 * 24;
      break;
    }
    case 'hour'   :  {
      noSecondsToQuery = noGraphIntervals * 3600;  
      endTime.setMinutes(0);
      candleSize = candleSize * 60;
      break;
    }
    case 'minute' :  {
      noSecondsToQuery = noGraphIntervals * 60;  
      break;
    }
    default       :  {
      noSecondsToQuery = noGraphIntervals * 60;  
      break;
    }
  }

  endTime = endTime.getTime();
  
  var startTime = subtractSeconds(endTime, noSecondsToQuery);
  endTime = Date.now();

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

 for(var i = 0; i < numberOfCandles; i++){
   endOfCurrentCandle = startTime + (i + 1)*candleSize;
   var d = new Date(endOfCurrentCandle);
   var endOfCurrentCandleTime = d.getFullYear()  + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() ;
   if(tradeList[tradeListIndex].timestamp > endOfCurrentCandle){
     var emptyCandleInfo = {
       open: 0,
       high: 0,
       low: 0,
       close: 0,
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
     var close = open;
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
