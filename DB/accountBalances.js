var mongojs = require('mongojs')
var config = require('../config.js');
var util = require('../../util.js');
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

var accountList = [];

function addToReservedCurrency1(accountId, amount){
  var account = accountList[accountId];
  account.reservedCurrency1 += amount;
  account.reservedCurrency1 = util.Round(account.reservedCurrency1, config.currency1.constant);
}

function removeFromReservedCurrency1(accountId, amount){
  addToReservedCurrency1(accountId, -1*amount);
}

function addToReservedCurrency2(accountId, amount){
  var account = accountList[accountId];
  account.reservedCurrency2 += amount;
  account.reservedCurrency2 = util.Round(account.reservedCurrency2, config.currency2.constant);
}

function removeFromReservedCurrency2(accountId, amount){
  addToReservedCurrency2(accountId, -1*amount);
}

function addNewAccount(newAccountObj, cb){
  if(!db){
    connectToDB(function(){
      addNewAccount(newAccountObj, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {
    db.balances.insert(newAccountObj, function(err, docs){
      logError(err);
      if(cb){
        cb(docs);
      }
    });
  }
}

/*function fetchLog(startTime, endTime, cb){
  if(!db){
    connectToDB(function(){
      fetchLog(startTime, endTime, function(res){
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
		
		db.orderLog.find(queryFilter, fieldSelection, function(err, docs){
      logError(err);
      cb(docs);
    });
  }
}*/

function closeDB(){
  db.close();
}

exports.AddNewAccount = addNewAccount;
exports.CloseDB = closeDB;

exports.AddToReservedCurrency1 = addToReservedCurrency1;
exports.AddToReservedCurrency2 = addToReservedCurrency2;
exports.RemoveFromReservedCurrency1 = removeFromReservedCurrency1;
exports.RemoveFromReservedCurrency2 = removeFromReservedCurrency2;
