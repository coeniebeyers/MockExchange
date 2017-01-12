var async = require('async');
var uuid = require('uuid').v1;

var events = require('./eventEmitter.js');
var config = require('../config.js');
var util = require('../util.js');

var balances;

function updateReserveAmountsByParams(accountId, amount, price, orderType){
  if(orderType == 'ask'){
    balances.AddToReservedCurrency1(accountId, amount, function(res){
      events.emit('reservedCurrencyUpdated', res);      
    });
  } else if(orderType == 'cancelask'){
    balances.RemoveFromReservedCurrency1(accountId, amount, function(res){
      events.emit('reservedCurrencyUpdated', res);      
    });
  } else if(orderType == 'matchedask'){
    balances.RemoveFromReservedCurrency1(accountId, amount, function(res){
      events.emit('reservedCurrencyUpdated', res);      
    });
  }  else if(orderType == 'bid'){
    var bidAmount = amount * price;
    balances.AddToReservedCurrency2(accountId, bidAmount, function(res){
      events.emit('reservedCurrencyUpdated', res);      
    });
  } else if(orderType == 'cancelbid'){
    var bidAmount = amount * price;
    balances.RemoveFromReservedCurrency2(accountId, bidAmount, function(res){
      events.emit('reservedCurrencyUpdated', res); 
    });
  } else if(orderType == 'matchedbid'){
    var bidAmount = amount * price;
    balances.RemoveFromReservedCurrency2(accountId, bidAmount, function(res){
      events.emit('reservedCurrencyUpdated', res); 
    });
  } 
}

function updateReserveAmounts(order){
  updateReserveAmountsByParams(order.accountId, order.amount, order.price, order.type);
}

function updateAccountBalances(match){
  var currency1Amount = Number(match.amount);
  var price = match.order1.price;
  var currency2Amount = price * currency1Amount;
  var account1Id = match.order1.accountId;
  var account2Id = match.order2.accountId;
  if(match.order1.type == 'ask'){
    async.parallel([
      function(cb){
        balances.RemoveFromCurrency1(account1Id, currency1Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        balances.AddToCurrency2(account1Id, currency2Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        updateReserveAmountsByParams(account1Id, currency1Amount, price, 'matchedask');
        cb(null, null);
      },
      function(cb){
        balances.AddToCurrency1(account2Id, currency1Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        balances.RemoveFromCurrency2(account2Id, currency2Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        updateReserveAmountsByParams(account2Id, currency1Amount, price, 'matchedbid');
        cb(null, null);
      }
    ], function(err, results){
      if(err){console.log('ERROR:', err)}
      events.emit('currencyBalanceUpdated', results);
    });
  } else if(match.order1.type == 'bid') { 
    async.parallel([
      function(cb){
        balances.AddToCurrency1(account1Id, currency1Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        balances.RemoveFromCurrency2(account1Id, currency2Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        updateReserveAmountsByParams(account1Id, currency1Amount, price, 'matchedbid');
        cb(null, null);
      },
      function(cb){
        balances.RemoveFromCurrency1(account2Id, currency1Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        balances.AddToCurrency2(account2Id, currency2Amount, function(res){
          cb(null, res);
        });
      },
      function(cb){
        updateReserveAmountsByParams(account2Id, currency1Amount, price, 'matchedask');
        cb(null, null);
      }
    ], function(err, results){
      if(err){console.log('ERROR:', err)}
      events.emit('currencyBalanceUpdated', results);
    });
  } else {
    console.log('WARNING: unhandled order type');
  } 
}

function auditTotals(){
  /*var totalCurrency1 = 0;
  var totalCurrency2 = 0;
  for(var i=balances.AccountList.length; i--;){
    totalCurrency1 += balances.AccountList[i].currency1;
    totalCurrency1 = util.Round(totalCurrency1, config.currency1.constant);
    totalCurrency2 += balances.AccountList[i].currency2; 
    totalCurrency2 = util.Round(totalCurrency2, config.currency2.constant);
  }  

  var totalDeposited1 = accountBalance*balances.AccountList.length;
  var totalDeposited2 = accountBalance*balances.AccountList.length;
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
  /*
  var accountOrders = calculateOpenInterest(bidsAndAsks);
  for(var accountId = balances.AccountList.length; accountId--;){
    if(accountOrders[accountId] !== undefined){
      var totalCurrency1 = accountOrders[accountId].currency1;
      var totalCurrency2 = accountOrders[accountId].currency2;
      var account = balances.AccountList[accountId];
      var reservedCurrency1 = account.reservedCurrency1;
      var reservedCurrency2 = account.reservedCurrency2;

      if(Math.abs(totalCurrency1-reservedCurrency1) > 0 
          || Math.abs(totalCurrency2-reservedCurrency2) > 0){
        console.log('ERROR: Mismatch between open orders and reserved balance for account:', 
          accountId);
        console.log('totalCurrency1:', totalCurrency1);
        console.log('account.reservedCurrency1:', reservedCurrency1);
        console.log('totalCurrency2:', totalCurrency2);
        console.log('account.reservedCurrency2:', reservedCurrency2);
      }
    }
  }
  */
}

function createAccount(cb){
  var newAccountObj = {
    currency1: 0,
    reservedCurrency1: 0,
    currency2: 0,
    reservedCurrency2: 0,
  };
  balances.AddNewAccount(newAccountObj, function(done){
    cb(newAccountObj);
  });
}

// This function enriches the information it pulls from DB/accountBalances
function getAccountBalances(accountId, cb){
  balances.GetBalance(accountId, function(accountBalance){
    var balanceObj = {
      accountId: accountId
    };
    balanceObj[config.currency1.name] = accountBalance.currency1; 
    balanceObj['reserved'+config.currency1.name] = accountBalance.reservedCurrency1; 
    balanceObj[config.currency2.name] = accountBalance.currency2; 
    balanceObj['reserved'+config.currency2.name] = accountBalance.reservedCurrency2; 
    cb(balanceObj);
  });
}

function adjustAccountBalance(obj, cb){
  if(obj.currency == config.currency1.name){
    balances.AddToCurrency1(obj.accountId, Number(obj.amount), function(res){
      getAccountBalances(obj.accountId, function(accountBalance){
        events.emit('currencyBalanceUpdated', res);
        cb(accountBalance);
      });
    });
  } else if (obj.currency == config.currency2.name){
    balances.AddToCurrency2(obj.accountId, Number(obj.amount), function(res){
      getAccountBalances(obj.accountId, function(accountBalance){
        events.emit('currencyBalanceUpdated', res);
        cb(accountBalance);
      });
    });
  } 
}

module.exports = function(modules){

  balances = modules.balances;
  
  var functions = {};

  functions.AdjustAccountBalance = adjustAccountBalance;
  functions.CreateAccount = createAccount;
  functions.GetAccountBalances = getAccountBalances;
  functions.AuditTotals = auditTotals;
  functions.AuditOrdersToReservedBalances = auditOrdersToReservedBalances;
  functions.UpdateReserveAmounts = updateReserveAmounts;
  functions.UpdateAccountBalances = updateAccountBalances;
  return functions;
};

