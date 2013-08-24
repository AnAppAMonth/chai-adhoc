
/* global describe, it */
/* jshint -W030 */
var chai = require('chai'),
    adhoc = require('../'),
    expect = chai.expect;

chai.use(adhoc);

// Extend `below` 3 times
adhoc.extendAssertion('below', function(ctx, n) {
    if (ctx.obj >= 1000 && n >= 1000) {
        // Require a difference of at least 100 for `below` to pass
        ctx.assert(
            ctx.obj + 100 < n
            , "expected #{this} to be below " + n
            , "expected #{this} to not be below " + n
        );
        return true;
    }
    return false;
});

adhoc.extendAssertion('below', function(ctx, n) {
    if (ctx.obj >= 5000 && n >= 5000) {
        // Require a difference of at least 500 for `below` to pass
        ctx.assert(
            ctx.obj + 500 < n
            , "expected #{this} to be below " + n
            , "expected #{this} to not be below " + n
        );
        return true;
    }
    return false;
});

adhoc.extendAssertion('below', function(ctx, n) {
    if (ctx.obj >= 10000 && n >= 10000) {
        // Require a difference of at least 1000 for `below` to pass
        ctx.assert(
            ctx.obj + 1000 < n
            , "expected #{this} to be below " + n
            , "expected #{this} to not be below " + n
        );
        return true;
    }
    return false;
});

// Wrap `below` 3 times
adhoc.wrapAssertion('below', function(error, ctx, n) {
    if (error) {
        error.message  = 'Prefix 1: ' + error.message;
    }
});

adhoc.wrapAssertion('below', function(error, ctx, n) {
    if (error) {
        error.message  = 'Prefix 2: ' + error.message;
    }
});

adhoc.wrapAssertion('below', function(error, ctx, n) {
    if (error) {
        error.message  = 'Prefix 3: ' + error.message;
    }
});

describe('Multiple extensions to assertion below', function() {
    it('should all take effect and in order', function() {
        expect(15000).to.be.below(16001);
        expect(15000).to.not.be.below(15999);
        expect(7000).to.be.below(7501);
        expect(7000).to.not.be.below(7499);
        expect(2000).to.be.below(2101);
        expect(2000).to.not.be.below(2099);
        expect(function() {
            expect(15000).to.not.be.below(16001);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
        expect(function() {
            expect(15000).to.be.below(15999);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
        expect(function() {
            expect(7000).to.not.be.below(7501);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
        expect(function() {
            expect(7000).to.be.below(7499);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
        expect(function() {
            expect(2000).to.not.be.below(2101);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
        expect(function() {
            expect(2000).to.be.below(2099);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
    });
});

describe('Multiple wrappers of assertion below', function() {
    it('should all take effect and in order', function() {
        expect(function() {
            expect(20).to.be.below(10);
        }).to.throw(/^Prefix 3: Prefix 2: Prefix 1: /);
    });
});
