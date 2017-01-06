var config = require('../config.js');
var util = require('../util.js');

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

function updateReserveAmountsByParams(accountId, amount, price, orderType){

  if(orderType == 'ask'){
    addToReservedCurrency1(accountId, amount);
  } else if(orderType == 'cancelask'){
    removeFromReservedCurrency1(accountId, amount);
  } else if(orderType == 'matchedask'){
    removeFromReservedCurrency1(accountId, amount);
  }  else if(orderType == 'bid'){
    var bidAmount = amount * price;
    addToReservedCurrency2(accountId, bidAmount);
  } else if(orderType == 'cancelbid'){
    var bidAmount = amount * price;
    removeFromReservedCurrency2(accountId, bidAmount);
  } else if(orderType == 'matchedbid'){
    var bidAmount = amount * price;
    removeFromReservedCurrency2(accountId, bidAmount);
  } 
}

function updateReserveAmounts(order){
  updateReserveAmountsByParams(order.accountId, order.amount, order.price, order.type);
}

function updateAccountBalances(match){
  var currency1Amount = match.amount;
  var price = match.order1.price;
  var currency2Amount = price * currency1Amount;
  if(match.order1.type == 'ask'){
    var account1 = accountList[match.order1.accountId];
    account1.currency1 -= currency1Amount;
    account1.currency1 = util.Round(account1.currency1, config.currency1.constant);
    account1.currency2 += currency2Amount;
    account1.currency2 = util.Round(account1.currency2, config.currency2.constant);
    updateReserveAmountsByParams(account1.id, currency1Amount, price, 'matchedask');

    var account2 = accountList[match.order2.accountId];
    account2.currency1 += currency1Amount;
    account2.currency1 = util.Round(account2.currency1, config.currency1.constant);
    account2.currency2 -= currency2Amount;
    account2.currency2 = util.Round(account2.currency2, config.currency2.constant);
    updateReserveAmountsByParams(account2.id, currency1Amount, price, 'matchedbid');
  } else if(match.order1.type == 'bid') { 
    var account1 = accountList[match.order1.accountId];
    account1.currency1 += currency1Amount;
    account1.currency1 = util.Round(account1.currency1, config.currency1.constant);
    account1.currency2 -= currency2Amount;
    account1.currency2 = util.Round(account1.currency2, config.currency2.constant);
    updateReserveAmountsByParams(account1.id, currency1Amount, price, 'matchedbid');

    var account2 = accountList[match.order2.accountId];
    account2.currency1 -= currency1Amount;
    account2.currency1 = util.Round(account2.currency1, config.currency1.constant);
    account2.currency2 += currency2Amount;
    account2.currency2 = util.Round(account2.currency2, config.currency2.constant);
    updateReserveAmountsByParams(account2.id, currency1Amount, price, 'matchedask');
  } 
}

function auditTotals(){
  /*var totalCurrency1 = 0;
  var totalCurrency2 = 0;
  for(var i=accountList.length; i--;){
    totalCurrency1 += accountList[i].currency1;
    totalCurrency1 = util.Round(totalCurrency1, config.currency1.constant);
    totalCurrency2 += accountList[i].currency2; 
    totalCurrency2 = util.Round(totalCurrency2, config.currency2.constant);
  }  

  var totalDeposited1 = accountBalance*accountList.length;
  var totalDeposited2 = accountBalance*accountList.length;
  var diffCurrency1 = Math.abs(totalCurrency1 - totalDeposited1);
  var diffCurrency2 = Math.abs(totalCurrency2 - totalDeposited2);

  
  if(Number(diffCurrency1) > 0 || Number(diffCurrency2) > 0){
    console.log('ERROR: Audited totals: '+'\nBTC: '+totalCurrency1+'\nUSD: '+totalCurrency2);
  }
  */
}

function calculateOpenInterest(bidsAndAsks){
  var accountOrders = [];
  // Get open orders for account
  var totalCurrency1 = 0;
  var totalCurrency2 = 0;    
  for(var i=bidsAndAsks.length; i--;){
    var order = bidsAndAsks[i];
    if(order.type == 'ask'){
      if(accountOrders[order.accountId] == undefined){
        accountOrders[order.accountId] = 
          {
            currency1: order.amount,
            currency2: 0
          };
      } else {
        accountOrders[order.accountId].currency1 += order.amount;
      }
      accountOrders[order.accountId].currency1 = 
        util.Round(accountOrders[order.accountId].currency1, config.currency1.constant);
    } else if(order.type == 'bid'){
      if(accountOrders[order.accountId] == undefined){
        var currency2 = order.amount * order.price;
        accountOrders[order.accountId] = 
          {
            currency1: 0,
            currency2: currency2
          };
      } else {
        accountOrders[order.accountId].currency2 += order.amount * order.price;
      }
      accountOrders[order.accountId].currency2 = 
        util.Round(accountOrders[order.accountId].currency2, config.currency2.constant);
    }
  }
  return accountOrders;
}

function auditOrdersToReservedBalances(bidsAndAsks){
  var accountOrders = calculateOpenInterest(bidsAndAsks);
  for(var accountId = accountList.length; accountId--;){
    if(accountOrders[accountId] !== undefined){
      var totalCurrency1 = accountOrders[accountId].currency1;
      var totalCurrency2 = accountOrders[accountId].currency2;
      var account = accountList[accountId];
      var reservedCurrency1 = account.reservedCurrency1;
      var reservedCurrency2 = account.reservedCurrency2;

      /*
      if(Math.abs(totalCurrency1-reservedCurrency1) > 0 
          || Math.abs(totalCurrency2-reservedCurrency2) > 0){
        console.log('ERROR: Mismatch between open orders and reserved balance for account:', 
          accountId);
        console.log('totalCurrency1:', totalCurrency1);
        console.log('account.reservedCurrency1:', reservedCurrency1);
        console.log('totalCurrency2:', totalCurrency2);
        console.log('account.reservedCurrency2:', reservedCurrency2);
      }
      */
    }
  }
}

function createAccount(cb){
  var newAccount = {
    currency1: 0,
    reservedCurrency1: 0,
    currency2: 0,
    reservedCurrency2: 0,
    id: accountList.length 
  };
  accountList.push(newAccount);
  if(cb){
    cb(accountList[newAccount.id]);
  } else {
    return accountList[newAccount.id];
  }
}

function getAccountBalances(accountId, cb){
  var account = accountList[accountId];
  var balanceObj = {
    accountId: accountId
  };
  balanceObj[config.currency1.name] = account.currency1; 
  balanceObj['reserved'+config.currency1.name] = account.reservedCurrency1; 
  balanceObj[config.currency2.name] = account.currency2; 
  balanceObj['reserved'+config.currency2.name] = account.reservedCurrency2; 
  if(cb){
    cb(balanceObj);
  } else {
    return balanceObj;
  }
}

function adjustAccountBalance(obj, cb){
  var account = accountList[obj.accountId];
  
  if(obj.currency == config.currency1.name){
    var adjustment = util.Round(Number(obj.amount), config.currency1.constant);
    account.currency1 += adjustment;
  } else if (obj.currency == config.currency2.name){
    var adjustment = util.Round(Number(obj.amount), config.currency2.constant);
    account.currency2 += adjustment;
  } 
 
  var balanceObj = getAccountBalances(obj.accountId);
  if(cb){
    cb(balanceObj);
  } else {
    return balanceObj;
  }
}

exports.AdjustAccountBalance = adjustAccountBalance;
exports.CreateAccount = createAccount;
exports.GetAccountBalances = getAccountBalances;
exports.AuditTotals = auditTotals;
exports.AuditOrdersToReservedBalances = auditOrdersToReservedBalances;
exports.UpdateReserveAmounts = updateReserveAmounts;
exports.UpdateAccountBalances = updateAccountBalances;
