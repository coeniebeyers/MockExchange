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

function addToCurrency1(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToCurrency1(accountId, amount, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {
    var account = accountList[accountId];
    account.currency1 += amount;
    account.currency1 = util.Round(account.currency1, config.currency1.constant);

    db.balances.update({_id: accountId}, {$inc: {currency1: amount}}, function(err, res){
      logError(err);
      if(cb){
        cb({accountId: accountId, amount: amount, result: res});
      }
    });
  }
}

function removeFromCurrency1(accountId, amount, cb){
  addToCurrency1(accountId, -1*amount, function(res){
    if(cb){
      cb(res);
    }
  });
}

function addToCurrency2(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToCurrency2(accountId, amount, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {

    var account = accountList[accountId];
    account.currency2 += amount;
    account.currency2 = util.Round(account.currency2, config.currency2.constant);

    db.balances.update({_id: accountId}, {$inc: {currency2: amount}}, function(err, res){
      logError(err);
      if(cb){
        cb({accountId: accountId, amount: amount, result: res});
      }
    });
  }
}

function removeFromCurrency2(accountId, amount, cb){
  addToCurrency2(accountId, -1*amount, function(res){
    if(cb){
      cb(res);
    }
  });
}

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
    newAccountObj._id = newAccountObj.id;
    accountList.push(newAccountObj);
    db.balances.insert(newAccountObj, function(err, docs){
      logError(err);
      db.balances.findOne({_id: newAccountObj.id}, function(err, doc){
        cb(doc);
      });
    });
  }
}

function getBalance(accountId, cb){
  if(!db){
    connectToDB(function(){
      getBalance(accountId, function(res){
        if(cb){
          cb(res);
        }
      });
    });
  } else {
    db.balances.findOne({_id: accountId}, function(err, doc){
      logError(err);
      cb(doc);
    });
  }
}

function closeDB(){
  db.close();
}

exports.AddNewAccount = addNewAccount;
exports.GetBalance = getBalance;
exports.AddToCurrency1 = addToCurrency1;
exports.AddToCurrency2 = addToCurrency2;
exports.RemoveFromCurrency1 = removeFromCurrency1;
exports.RemoveFromCurrency2 = removeFromCurrency2;
exports.AddToReservedCurrency1 = addToReservedCurrency1;
exports.AddToReservedCurrency2 = addToReservedCurrency2;
exports.RemoveFromReservedCurrency1 = removeFromReservedCurrency1;
exports.RemoveFromReservedCurrency2 = removeFromReservedCurrency2;

exports.AccountList = accountList;

exports.CloseDB = closeDB;
