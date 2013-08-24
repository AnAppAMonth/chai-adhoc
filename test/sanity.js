
/* global describe, it */
/* jshint -W030 */
var chai = require('chai'),
    adhoc = require('../'),
    expect = chai.expect;

chai.use(adhoc);

var noop = function() {};

describe('Methods called with wrong arguments', function() {
    it('should be rejected', function() {
        expect(function() {
            adhoc.addAssertion();
        }).to.throw(/name is not a string/);
        expect(function() {
            adhoc.addAssertion('abc');
        }).to.throw(/func is not a function/);
        expect(function() {
            adhoc.addAssertion('abc', noop, 3);
        }).to.throw(/getter is not a function/);

        expect(function() {
            adhoc.addSimple();
        }).to.throw(/name is not a string/);
        expect(function() {
            adhoc.addSimple('abc');
        }).to.throw(/func is not a function/);

        expect(function() {
            adhoc.extendAssertion();
        }).to.throw(/name is not a string/);
        expect(function() {
            adhoc.extendAssertion('abc');
        }).to.throw(/func is not a function/);

        expect(function() {
            adhoc.wrapAssertion();
        }).to.throw(/name is not a string/);
        expect(function() {
            adhoc.wrapAssertion('abc');
        }).to.throw(/func is not a function/);
    });
});

describe('addAssertion() or addSimple()', function() {
    describe('called with existing names', function() {
        it('should be rejected', function() {
            expect(function() {
                adhoc.addAssertion('null', noop);
            }).to.throw(/Assertion "null" already exists/);
            expect(function() {
                adhoc.addSimple('members', noop);
            }).to.throw(/Assertion "members" already exists/);
        });
    });
});

describe('extendAssertion() or wrapAssertion()', function() {
    describe('called with non-existing names', function() {
        it('should be rejected', function() {
            expect(function() {
                adhoc.extendAssertion('wtf', noop);
            }).to.throw(/Assertion "wtf" doesn't exist/);
            expect(function() {
                adhoc.wrapAssertion('nonExisted', noop);
            }).to.throw(/Assertion "nonExisted" doesn't exist/);
        });
    });
    describe('called with existing names with wrong types', function() {
        it('should be rejected', function() {
            expect(function() {
                adhoc.extendAssertion('to', noop);
            }).to.throw(/chainable getter/);
            expect(function() {
                adhoc.wrapAssertion('itself', noop);
            }).to.throw(/flag setter/);
            expect(function() {
                adhoc.extendAssertion('assert', noop);
            }).to.throw(/internal member/);
            expect(function() {
                adhoc.wrapAssertion('contain', noop);
            }).to.throw(/chainable method/);
        });
    });
});
