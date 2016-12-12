var uuid = require('uuid');
var expect = require('expect.js');
var orderLog = require('./orderLog.js');
var exchange = require('../Exchange/exchange.js')(orderLog);
var accountManagement = require('../Exchange/accountManagement.js');

var account = null;

describe('exchange', function() {
  //exchange.SetOrderLog(orderLog);
  it('should be able to add an account', function(done){
    account = accountManagement.CreateAccounts();
    done();
  });
  it('should be able to add a bid', function(done) {
    var orderTimestamp = new Date().getTime();
    var accountId = 0;
    var orderId = uuid.v1();
    var bidOrAsk = 'bid';
    var price = 750;
    var amount = 100;
    var bid = {
      timestamp: orderTimestamp,
      id: orderId,
      accountId: accountId,
      type: bidOrAsk,
      price: price,
      amount: amount
    }; 
    exchange.SubmitNewOrderForMatching(bid, function(res){
      expect(res.submitted).to.equal(true);
      done();
    });
  });
  it('should be able to add an ask', function(done) {
    var orderTimestamp = new Date().getTime();
    var accountId = 0;
    var orderId = uuid.v1();
    var bidOrAsk = 'ask';
    var price = 751;
    var amount = 100;
    var bid = {
      timestamp: orderTimestamp,
      id: orderId,
      accountId: accountId,
      type: bidOrAsk,
      price: price,
      amount: amount
    }; 
    exchange.SubmitNewOrderForMatching(bid, function(res){
      expect(res.submitted).to.equal(true);
      done();
    });
  });
  it('should be able to add a matcing bid', function(done) {
    var orderTimestamp = new Date().getTime();
    var accountId = 0;
    var orderId = uuid.v1();
    var bidOrAsk = 'bid';
    var price = 751;
    var amount = 90;
    var bid = {
      timestamp: orderTimestamp,
      id: orderId,
      accountId: accountId,
      type: bidOrAsk,
      price: price,
      amount: amount
    }; 
    exchange.SubmitNewOrderForMatching(bid, function(res){
      expect(res.submitted).to.equal(true);
      done();
    });
  });
});
