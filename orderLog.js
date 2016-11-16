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

function logOrder(order, cb){
  if(!db){
    connectToDB(function(){
      logOrder(order, function(res){
        cb(res);
      });
    });
  } else {
    db.orderLog.insert(order, function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}

function closeDB(){
  db.close();
}

exports.LogOrder = logOrder;
exports.CloseDB = closeDB;
