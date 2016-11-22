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

process.stdin.setEncoding('utf8');
process.stdin.resume();

process.stdin.on('data', function(orderStr){
  var orderList = orderStr.split('\n');
  //console.log('orderList:', orderList);
  for(var i in orderList){
    if(orderList[i] != ''){
      var order = JSON.parse(orderList[i]);
      addLog(order, function(res){    
      });
    }
  }
});

function addLog(order, cb){
  if(!db){
    connectToDB(function(){
      addLog(order, function(res){
        cb(res);
      });
    });
  } else {
    order._id = order.id;
    db.orderLog.insert(order, function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}

function closeDB(){
  db.close();
}

exports.AddLog = addLog;
exports.CloseDB = closeDB;