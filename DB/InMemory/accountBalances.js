var config = require('../../config.js');
var util = require('../../util.js');

var accountList = [];

function addToReservedCurrency1(accountId, amount, cb){
  var account = accountList[accountId];
  account.reservedCurrency1 += amount;
  account.reservedCurrency1 = util.Round(account.reservedCurrency1, config.currency1.constant);
  if(cb){
    cb(account);
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
  var account = accountList[accountId];
  account.reservedCurrency2 += amount;
  account.reservedCurrency2 = util.Round(account.reservedCurrency2, config.currency2.constant);
  if(cb){
    cb(account);
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
  accountList.push(newAccountObj);
  if(cb){ 
    cb(newAccountObj);
  }
}

exports.AddToReservedCurrency1 = addToReservedCurrency1;
exports.AddToReservedCurrency2 = addToReservedCurrency2;
exports.RemoveFromReservedCurrency1 = removeFromReservedCurrency1;
exports.RemoveFromReservedCurrency2 = removeFromReservedCurrency2;
exports.AddNewAccount = addNewAccount;

exports.AccountList = accountList;
