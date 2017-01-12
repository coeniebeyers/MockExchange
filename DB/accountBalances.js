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
        cb(res);
      });
    });
  } else {
    db.balances.update({_id: mongojs.ObjectID(accountId)}, {$inc: {currency1: amount}}, function(err, res){
      logError(err);
      cb({accountId: accountId, amount: amount, result: res});
    });
  }
}

function removeFromCurrency1(accountId, amount, cb){
  addToCurrency1(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addToCurrency2(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToCurrency2(accountId, amount, function(res){
        cb(res);
      });
    });
  } else {
    db.balances.update({_id: mongojs.ObjectID(accountId)}, {$inc: {currency2: amount}}, function(err, res){
      logError(err);
      cb({accountId: accountId, amount: amount, result: res});
    });
  }
}

function removeFromCurrency2(accountId, amount, cb){
  addToCurrency2(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addToReservedCurrency1(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToReservedCurrency1(accountId, amount, function(res){
        cb(res);
      });
    });
  } else {
    db.balances.update({_id: mongojs.ObjectID(accountId)}, {$inc: {reservedCurrency1: amount}}, function(err, res){
      logError(err);
      cb({accountId: accountId, amount: amount, result: res});
    });
  }
}

function removeFromReservedCurrency1(accountId, amount, cb){
  addToReservedCurrency1(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addToReservedCurrency2(accountId, amount, cb){
  if(!db){
    connectToDB(function(){
      addToReservedCurrency2(accountId, amount, function(res){
        cb(res);
      });
    });
  } else {
    db.balances.update({_id: mongojs.ObjectID(accountId)}, {$inc: {reservedCurrency2: amount}}, function(err, res){
      logError(err);
      cb({accountId: accountId, amount: amount, result: res});
    });
  }
}

function removeFromReservedCurrency2(accountId, amount, cb){
  addToReservedCurrency2(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addNewAccount(newAccountObj, cb){
  if(!db){
    connectToDB(function(){
      addNewAccount(newAccountObj, function(res){
        cb(res);
      });
    });
  } else {
    db.balances.insert(newAccountObj, function(err, doc){
      logError(err);
      doc.id = doc._id;
      cb(doc);
    });
  }
}

function getBalance(accountId, cb){
  if(!db){
    connectToDB(function(){
      getBalance(accountId, function(res){
        cb(res);
      });
    });
  } else {
    db.balances.findOne({_id: mongojs.ObjectID(accountId)}, function(err, doc){
      logError(err);
      if(doc && doc._id){
        doc.id = doc._id;
      }
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

exports.CloseDB = closeDB;
