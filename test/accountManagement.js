var expect = require('expect.js');
var accountManagement = require('../Exchange/accountManagement.js');

var accountList = [];

describe('Account', function() {
  it('should be able to add an account', function(done){
    var account = accountManagement.CreateAccount();
    accountList.push(account);
    done();
  });
  it('should be able to return the balance of an account', function(done){
    accountManagement.GetAccountBalances(accountList[0].id, function(accountBalance){ 
      expect(accountBalance.BTC).to.equal(0);
      expect(accountBalance.USD).to.equal(0);
      done();
    });
  });
  /*it('should be able to update account balances', function(done){
    
    done();
  });
  it('should be able to update account balances', function(done){
    
    done();
  });*/
});