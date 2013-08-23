
/* global describe, it */
/* jshint -W030 */
var chai = require('../'),
    expect = require('chai').expect;

chai.addSimple('aBitMoreThan', function(ctx, n) {
    ctx.expect(ctx.obj).to.be.a('number').within(n, 1.5 * n);
});

describe('Simple assertion aBitMoreThan', function() {
    it('should behave as expected if not negated', function() {
        expect(10).to.be.aBitMoreThan(8);
        expect(function() {
            expect(10).to.be.aBitMoreThan(6);
        }).to.throw();
    });
    it('should fail if negated', function() {
        expect(function() {
            expect(100).to.not.be.aBitMoreThan(10);
        }).to.throw(/^The 'negate' flag is used with a simple assertion 'aBitMoreThan'$/);
    });
});
