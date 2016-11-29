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

function logDate(display, timestamp){
	var date = new Date(timestamp);
	// Hours part from the timestamp
	var year = date.getFullYear();
	// Minutes part from the timestamp
	var month = date.getMonth() + 1;
	// Seconds part from the timestamp
	var day = date.getDate();
	// Hours part from the timestamp
	var hours = date.getHours();
	// Minutes part from the timestamp
	var minutes = "0" + date.getMinutes();
	// Seconds part from the timestamp
	var seconds = "0" + date.getSeconds();

	// Will display time in 10:30:23 format
	var formattedTime = year + '/' + month + '/' + day + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  console.log(display + ": " + formattedTime);
}

function subtractSeconds(date, secondsToSubtract) {
  var ret = new Date(date); //don't change original date
  ret.setTime(ret.getTime() - secondsToSubtract*1000);
  return ret.getTime();
}

function fetchLog(noSeconds, cb){
  if(!db){
    connectToDB(function(){
      fetchLog(noSeconds, function(res){
        cb(res);
      });
    });
  } else {
    var endTime = Date.now();
    var startTime = subtractSeconds(endTime, noSeconds);
		logDate('startTime', startTime);
    logDate('endTime', endTime);
    //get list of orders
    //return list of orders 
    db.orderLog.find(function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}

function closeDB(){
  db.close();
}

exports.AddLog = addLog;
exports.FetchLog = fetchLog;
exports.CloseDB = closeDB;
