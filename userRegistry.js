var mongojs = require('mongojs')
var config = require('./config.js');
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

function getTrades(cb){
  if(!db){
    connectToDB(function(){
      getTrades(function(res){
        cb(res);
      });
    });
  } else {
    db.btcusdtrades.find({}).sort({'timestamp': 1}, function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}

function getTradesBetweenDates(timestampStart, timestampEnd, cb){
  if(!db){
    connectToDB(function(){
      getTradesBetweenDates(timestampStart, timestampEnd, function(res){
        cb(res);
      });
    });
  } else {
    db.btcusdtrades.find(
        {$and: [{'timestamp': {$gte: timestampStart}}, {'timestamp': {$lte: timestampEnd}}]})
        .sort({'timestamp': 1}, function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}

function closeDB(){
  db.close();
}

exports.GetTrades = getTrades;
exports.GetTradesBetweenDates = getTradesBetweenDates;
exports.CloseDB = closeDB;
