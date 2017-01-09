var expect = require('expect.js');
var accountManagement = require('../Exchange/accountManagement.js');

var accountList = [];

describe('Account', function() {
  it('should be able to add accounts', function(done){
    accountManagement.CreateAccount(function(newAccount){
      accountList.push(newAccount);
      accountManagement.CreateAccount(function(newAccount){
        accountList.push(newAccount);
        done();
      });
    });
  });
  it('should be able to return the balance of an account', function(done){
    accountManagement.GetAccountBalances(accountList[0].id, function(accountBalance){ 
      expect(accountBalance.BTC).to.equal(0);
      expect(accountBalance.USD).to.equal(0);
      expect(accountBalance.accountId).to.equal(accountList[0].id);
      done();
    });
  });
  it('should be able to adjust BTC account balances', function(done){
    var obj = {
      accountId: accountList[0].id,
      amount: 100,
      currency: 'BTC'
    };
    accountManagement.AdjustAccountBalance(obj, function(accountBalance){
      expect(accountBalance.BTC).to.equal(obj.amount);
      expect(accountBalance.USD).to.equal(0);
      done();
    });
  });
  it('should be able to adjust USD account balances', function(done){
    var obj = {
      accountId: accountList[1].id,
      amount: 1000,
      currency: 'USD'
    };
    accountManagement.AdjustAccountBalance(obj, function(accountBalance){
      expect(accountBalance.BTC).to.equal(0);
      expect(accountBalance.USD).to.equal(obj.amount);
      done();
    });
  });
  it('should be able to update account balances on a matching ask', function(done){
    var match = {
      order1: {
        timestamp: 1481536182350,
        id: '4e374320-c050-11e6-992a-730712547a2a',
        accountId: 0,
        type: 'ask',
        price: 10,
        amount: 20 
      },
      order2: {
        timestamp: 1481536182351,
        id: '4e374323-c050-11e6-992a-730712547a2a',
        accountId: 1,
        type: 'bid',
        price: 10,
        amount: 20 },
      amount: 20
    };    
    accountManagement.UpdateAccountBalances(match);
    var balances1 = accountManagement.GetAccountBalances(accountList[0].id);
    expect(balances1.accountId).to.be(0);
    expect(balances1.BTC).to.be(80);
    expect(balances1.USD).to.be(200);

    var balances2 = accountManagement.GetAccountBalances(accountList[1].id);
    expect(balances2.accountId).to.be(1);
    expect(balances2.BTC).to.be(20);
    expect(balances2.USD).to.be(800);
    done();
  });
  it('should be able to update account balances on a matching bid', function(done){
    var match = {
      order1: {
        timestamp: 1481536182350,
        id: '4e374320-c050-11e6-992a-730712547a2a',
        accountId: 0,
        type: 'bid',
        price: 10,
        amount: 10 
      },
      order2: {
        timestamp: 1481536182351,
        id: '4e374323-c050-11e6-992a-730712547a2a',
        accountId: 1,
        type: 'ask',
        price: 10,
        amount: 10 },
      amount: 10
    };    
    accountManagement.UpdateAccountBalances(match);
    var balances1 = accountManagement.GetAccountBalances(accountList[0].id);
    expect(balances1.accountId).to.be(0);
    expect(balances1.BTC).to.be(90);
    expect(balances1.USD).to.be(100);

    var balances2 = accountManagement.GetAccountBalances(accountList[1].id);
    expect(balances2.accountId).to.be(1);
    expect(balances2.BTC).to.be(10);
    expect(balances2.USD).to.be(900);
    done();
  });
  it('should be able to update reserved balances on a matching ask', function(done){
    var oldBalancesAccount1 = accountManagement.GetAccountBalances(accountList[0].id);
    var oldBalancesAccount2 = accountManagement.GetAccountBalances(accountList[1].id);
    var match = {
      order1: {
        timestamp: 1481536182350,
        id: '4e374320-c050-11e6-992a-730712547a2a',
        accountId: accountList[0].id,
        type: 'ask',
        price: 10,
        amount: 20 
      },
      order2: {
        timestamp: 1481536182351,
        id: '4e374323-c050-11e6-992a-730712547a2a',
        accountId: accountList[1].id,
        type: 'bid',
        price: 10,
        amount: 20 },
      amount: 20
    };    
    accountManagement.UpdateAccountBalances(match);
    var balances1 = accountManagement.GetAccountBalances(accountList[0].id);
    expect(balances1.accountId).to.be(0);
    expect(balances1.reservedBTC).to.be(oldBalancesAccount1.reservedBTC - match.amount);

    var balances2 = accountManagement.GetAccountBalances(accountList[1].id);
    expect(balances2.accountId).to.be(1);
    var price = match.order1.price;
    expect(balances2.reservedUSD).to.be(oldBalancesAccount2.reservedUSD - match.amount * price);
    done();
  });
  it('should be able to update reserved balances on a matching bid', function(done){
    var oldBalancesAccount1 = accountManagement.GetAccountBalances(accountList[0].id);
    var oldBalancesAccount2 = accountManagement.GetAccountBalances(accountList[1].id);
    var match = {
      order1: {
        timestamp: 1481536182350,
        id: '4e374320-c050-11e6-992a-730712547a2a',
        accountId: 0,
        type: 'bid',
        price: 10,
        amount: 10 
      },
      order2: {
        timestamp: 1481536182351,
        id: '4e374323-c050-11e6-992a-730712547a2a',
        accountId: 1,
        type: 'ask',
        price: 10,
        amount: 10 },
      amount: 10
    };    

    accountManagement.UpdateAccountBalances(match);

    var balances1 = accountManagement.GetAccountBalances(accountList[0].id);
    expect(balances1.accountId).to.be(0);
    var price = match.order1.price;
    expect(balances1.reservedUSD).to.be(oldBalancesAccount1.reservedUSD - match.amount*price);

    var balances2 = accountManagement.GetAccountBalances(accountList[1].id);
    expect(balances2.accountId).to.be(1);
    expect(balances2.reservedBTC).to.be(oldBalancesAccount2.reservedBTC - match.amount);
    done();
  });
});
