var mongojs = require('mongojs')
var config = require('../config.js');
var db;

function logError(err){
  if(err){
    if(err.message == 'ns not found'){
      return;
    } else {
      console.log(err);
    }
  }
}

function connectToDB(cb){
  var dbConnection = mongojs(config.dbConnectionString, config.dbCollections);
  db = dbConnection;
  cb();
};

function fetchCandlesticks(startTime, endTime, interval, cb){
  if(!db){
    connectToDB(function(){
      fetchCandlesticks(startTime, endTime, interval, function(res){
        cb(res);
      });
    });
  } else {
		var queryFilter = {
				'order2.timestamp': {
						$gte: startTime,
						$lte: endTime
				}
			};
    var fieldSelection = {
			"order2.timestamp":1, 
			"order1.price":1, 
			"amount":1
    };
	/*	
		db.orderLog.find(queryFilter, fieldSelection, function(err, docs){
      logError(err);
      cb(docs);
    });
    */
    cb(null);
  }
}

function closeDB(){
  db.close();
}

exports.FetchCandlesticks = fetchCandlesticks;
