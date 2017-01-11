var mongojs = require('mongojs')
var config = require('../config.js');
var util = require('../util.js');
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

function addToReservedCurrency1(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToReservedCurrency1(accountId, amount, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {
    var account = accountList[accountId];
    account.reservedCurrency1 += amount;
    account.reservedCurrency1 = util.Round(account.reservedCurrency1, config.currency1.constant);

    db.balances.update({_id: accountId}, {$inc: {reservedCurrency1: amount}}, function(err, res){
      logError(err);
      if(cb){
        cb({accountId: accountId, amount: amount, result: res});
      }
    });
  }
}

function removeFromReservedCurrency1(accountId, amount, cb){
  addToReservedCurrency1(accountId, -1*amount, function(res){
    if(cb){
      cb(res);
    }
  });
}

function addToReservedCurrency2(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToReservedCurrency2(accountId, amount, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {

    var account = accountList[accountId];
    account.reservedCurrency2 += amount;
    account.reservedCurrency2 = util.Round(account.reservedCurrency2, config.currency2.constant);

    db.balances.update({_id: accountId}, {$inc: {reservedCurrency2: amount}}, function(err, res){
      logError(err);
      if(cb){
        cb({accountId: accountId, amount: amount, result: res});
      }
    });
  }
}

function removeFromReservedCurrency2(accountId, amount, cb){
  addToReservedCurrency2(accountId, -1*amount, function(res){
    if(cb){
      cb(res);
    }
  });
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
    newAccountObj._id = ''+newAccountObj.id;
    accountList.push(newAccountObj);
    db.balances.insert(newAccountObj, function(err, docs){
      logError(err);
      db.balances.find({}, function(err, docs){
        if(cb){
          cb(docs);
        }
      });
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

exports.AccountList = accountList;
