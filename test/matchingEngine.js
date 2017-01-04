var uuid = require('uuid');
var expect = require('expect.js');
var accountManagement = require('../Exchange/accountManagement.js');
var orderLog = require('../DB/InMemory/orderLog.js');
var testModules = {
  orderLog: orderLog
};
var exchange = require('../Exchange/exchange.js')(testModules);
var mockOrders = require('./fixtures/orders.js').MockOrders;

var account = null;

describe('Matching engine', function() {
  it('should be able to add an account', function(done){
    account = accountManagement.CreateAccount();
    done();
  });
  it('should be able to add a bid', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[0], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(0);
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
    exchange.SubmitNewOrderForMatching(mockOrders[1], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(1);
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182350);
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
    exchange.SubmitNewOrderForMatching(mockOrders[2], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(1, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(1);
        expect(bidsAndAsks.asks[0].timestamp).to.equal(1481536182350);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374320-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].accountId).to.equal(0);
        expect(bidsAndAsks.asks[0].type).to.equal('ask');
        expect(Number(bidsAndAsks.asks[0].price)).to.equal(751);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(10);
        done();
      });
    });
  });
  it('should be able to add a matching ask', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[3], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(2, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(1);
        expect(bidsAndAsks.bids[0].timestamp).to.equal(1481536182349);
        expect(bidsAndAsks.bids[0].id).to.equal('4e367fd0-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.bids[0].accountId).to.equal(0);
        expect(bidsAndAsks.bids[0].type).to.equal('bid');
        expect(Number(bidsAndAsks.bids[0].price)).to.equal(750);
        expect(Number(bidsAndAsks.bids[0].amount)).to.equal(10);
        done();
      });
    });
  });
  it('should be able to add a few asks', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[4], function(res){
    exchange.SubmitNewOrderForMatching(mockOrders[5], function(res){
    exchange.SubmitNewOrderForMatching(mockOrders[6], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(10, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(4);
        done();
      });
    });
    });
    });
  });
  it('one bid should be able to partially take two asks', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[7], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(10, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(1);
        expect(bidsAndAsks.asks.length).to.be(3);
        expect(bidsAndAsks.asks[0].id).to.equal('4e374324-c050-11e6-992a-730712547a2a');
        expect(Number(bidsAndAsks.bids[0].amount)).to.equal(10);
        done();
      });
    });
  });
  it('a bid should be able to be partially fulfilled', function(done) {
    exchange.SubmitNewOrderForMatching(mockOrders[8], function(res){
      expect(res.submitted).to.equal(true);
      exchange.GetBidsAndAsks(10, function(bidsAndAsks){
        expect(bidsAndAsks.bids.length).to.be(2);
        expect(bidsAndAsks.asks.length).to.be(2);
        expect(bidsAndAsks.bids[0].id).to.equal('4e374328-c050-11e6-992a-730712547a2a');
        expect(bidsAndAsks.asks[0].id).to.equal('4e374325-c050-11e6-992a-730712547a2a');
        expect(Number(bidsAndAsks.bids[0].amount)).to.equal(40);
        expect(Number(bidsAndAsks.asks[0].amount)).to.equal(50);
        done();
      });
    });
  });
});
