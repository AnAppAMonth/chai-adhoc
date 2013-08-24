
/* global describe, it */
/* jshint -W030 */
var chai = require('chai'),
    adhoc = require('../'),
    expect = chai.expect;

chai.use(adhoc);

adhoc.extendAssertion('null', function(ctx) {
    if (typeof ctx.obj === 'string') {
        ctx.assert(
            ctx.obj.length < 3,
            'expected ${this} to be null',
            'expected ${this} to not be null'
        );
        return true;
    }
    return false;
});

describe('Overwritten property null', function() {
    it('should behave as expected for strings', function() {
        expect('ab').to.be.null;
        expect('abc').to.not.be.null;
        expect(function() {
            expect('ab').to.not.be.null;
        }).to.throw();
        expect(function() {
            expect('abc').to.be.null;
        }).to.throw();
    });
    it('should behave as usual for non-strings', function() {
        expect(null).to.be.null;
        expect(undefined).to.not.be.null;
        expect(function() {
            expect(null).to.not.be.null;
        }).to.throw();
        expect(function() {
            expect(undefined).to.be.null;
        }).to.throw();
    });
});
