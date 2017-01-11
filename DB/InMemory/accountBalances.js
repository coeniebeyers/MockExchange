var config = require('../../config.js');
var util = require('../../util.js');

var accountList = [];

function addToCurrency1(accountId, amount, cb){
  var account = accountList[accountId];
  account.currency1 += amount;
  account.currency1 = util.Round(account.currency1, config.currency1.constant);
  cb(account);
}

function removeFromCurrency1(accountId, amount, cb){
  addToCurrency1(accountId, -1*amount, function(res){
    cb(res);
  }); 
}

function addToCurrency2(accountId, amount, cb){
  var account = accountList[accountId];
  account.currency2 += amount;
  account.currency2 = util.Round(account.currency2, config.currency2.constant);
  cb(account);
}

function removeFromCurrency2(accountId, amount, cb){
  addToCurrency2(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addToReservedCurrency1(accountId, amount, cb){
  var account = accountList[accountId];
  account.reservedCurrency1 += amount;
  account.reservedCurrency1 = util.Round(account.reservedCurrency1, config.currency1.constant);
  cb(account);
}

function removeFromReservedCurrency1(accountId, amount, cb){
  addToReservedCurrency1(accountId, -1*amount, function(res){
    cb(res);
  }); 
}

function addToReservedCurrency2(accountId, amount, cb){
  var account = accountList[accountId];
  account.reservedCurrency2 += amount;
  account.reservedCurrency2 = util.Round(account.reservedCurrency2, config.currency2.constant);
  cb(account);
}

function removeFromReservedCurrency2(accountId, amount, cb){
  addToReservedCurrency2(accountId, -1*amount, function(res){
    cb(res);
  });
}

function addNewAccount(newAccountObj, cb){
  accountList.push(newAccountObj);
  cb(newAccountObj);
}


exports.AddToCurrency1 = addToCurrency1;
exports.AddToCurrency2 = addToCurrency2;
exports.RemoveFromCurrency1 = removeFromCurrency1;
exports.RemoveFromCurrency2 = removeFromCurrency2;
exports.AddToReservedCurrency1 = addToReservedCurrency1;
exports.AddToReservedCurrency2 = addToReservedCurrency2;
exports.RemoveFromReservedCurrency1 = removeFromReservedCurrency1;
exports.RemoveFromReservedCurrency2 = removeFromReservedCurrency2;
exports.AddNewAccount = addNewAccount;

exports.AccountList = accountList;
