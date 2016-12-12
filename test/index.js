var uuid = require('uuid');
var expect = require('expect.js');
var orderLog = require('./orderLog.js');
var exchange = require('../Exchange/exchange.js')(orderLog);
var accountManagement = require('../Exchange/accountManagement.js');

var account = null;

describe('exchange', function() {
  it('should be able to add an account', function(done){
    account = accountManagement.CreateAccount();
    done();
  });
  it('should be able to add a bid', function(done) {
    var orderTimestamp = 1481536182349;
    var accountId = 0;
    var orderId = '4e367fd0-c050-11e6-992a-730712547a2a';
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
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.bids[0].timestamp).to.equal(1481536182349);
        expect(bidsAndAsks.bids[0].id).to.equal('4e367fd0-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.bids[0].accountId).to.equal(0);
        expect(bidsAndAsks.bids[0].type).to.equal('bid');
        expect(Number(bidsAndAsks.bids[0].price)).to.equal(750);
        expect(Number(bidsAndAsks.bids[0].amount)).to.equal(100);
        done();
      });
    });
  });
  it('should be able to add an ask', function(done) {
    var orderTimestamp = 1481536182354;
    var accountId = 0;
    var orderId = '4e374320-c050-11e6-992a-730712547a2a';
    var bidOrAsk = 'ask';
    var price = 751;
    var amount = 100;
    var ask = {
      timestamp: orderTimestamp,
      id: orderId,
      accountId: accountId,
      type: bidOrAsk,
      price: price,
      amount: amount
    }; 
    exchange.SubmitNewOrderForMatching(ask, function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182354);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374320-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].accountId).to.equal(0);
        expect(bidsAndAsks.asks[0].type).to.equal('ask');
        expect(Number(bidsAndAsks.asks[0].price)).to.equal(751);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(100);
        done();
      });
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
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182354);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374320-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].accountId).to.equal(0);
        expect(bidsAndAsks.asks[0].type).to.equal('ask');
        expect(Number(bidsAndAsks.asks[0].price)).to.equal(751);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(10);
        done();
      });
    });
  });
});
