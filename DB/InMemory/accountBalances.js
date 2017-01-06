var config = require('../../config.js');
var util = require('../../util.js');

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

exports.AddToReservedCurrency1 = addToReservedCurrency1;
exports.AddToReservedCurrency2 = addToReservedCurrency2;
exports.RemoveFromReservedCurrency1 = removeFromReservedCurrency1;
exports.RemoveFromReservedCurrency2 = removeFromReservedCurrency2;

exports.AccountList = accountList;
