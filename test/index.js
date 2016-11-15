var expect = require('expect.js'),
    exchange = require('..');

describe('exchange', function() {
  it('should say hello', function(done) {
    expect(exchange()).to.equal('Hello, world');
    done();
  });
});
