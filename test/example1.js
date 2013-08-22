
/* global describe, it */
/* jshint -W030 */
var chai = require('../'),
    expect = require('chai').expect;

// Code to test
function Model (type) {
    this._type = type;
    this._attrs = {};
}

Model.prototype.set = function (key, value) {
    this._attrs[key] = value;
};

Model.prototype.get = function (key) {
    return this._attrs[key];
};

var arthur = new Model('person');
arthur.set('name', 'Arthur Dent');
arthur.set('occupation', 'traveller');
arthur.set('age', 27);

// Define custom assertions

// Property `model`
chai.addAssertion('model', function(obj, assert, flag) {
    return function() {
        assert(
            obj instanceof Model
            , 'expected #{this} to be a Model'
            , 'expected #{this} to not be a Model'
        );
    };
});

// Method `model2`
var flagList = [];
chai.addAssertion('model2', function(obj, assert, flag) {
    return function(type) {
        flagList.push(flag('negate'));
        assert(obj, 'model type check').flags().to.be.instanceof(Model);
        assert(obj, 'model type check').flags('negate').to.be.instanceof(Model);
        assert(
            obj._type === type
            , "expected #{this} to be of type #{exp} but got #{act}"
            , "expected #{this} to not be of type #{act}"
            , type        // expected
            , obj._type   // actual
        );
    };
});

// Chainable method `age`
chai.addAssertion('age', function(obj, assert, flag) {
    return function(n) {
        // make sure we are working with a model
        assert(obj).to.be.instanceof(Model);

        // make sure we have an age and its a number
        var age = obj.get('age');
        assert(age).to.be.a('number');

        // do our comparison
        assert(
            age === n
            , "expected #{this} to have have #{exp} but got #{act}"
            , "expected #{this} to not have age #{act}"
            , n
            , age
        );
    };
}, function(flag) {
    flag('model.age', true);
});

// Do the tests
describe('New assertions', function() {
    it('should not be added if they already exist', function() {
        var noop = function() {};
        expect(function() {
            chai.addAssertion('contain', noop);
        }).to.throw(TypeError);
        expect(function() {
            chai.addAssertion('above', noop, noop);
        }).to.throw(TypeError);
    });
});

describe('Property model', function() {
    it('should be successfully added', function() {
        expect(expect(new Model())).to.have.property('model');
        expect(function() {
            expect(expect(1)).to.have.property('model');
        }).to.throw();
    });
    it('should behave as expected', function() {
        expect(arthur).to.be.a.model;
        expect(1).to.not.be.a.model;
        expect(function() {
            expect(arthur).to.not.be.a.model;
        }).to.throw();
        expect(function() {
            expect(1).to.be.a.model;
        }).to.throw();
    });
});

describe('Method model2', function() {
    it('should be successfully added', function() {
        expect(expect(new Model())).to.have.property('model2').that.is.a('function');
        expect(function() {
            expect(expect(1)).to.have.property('model2');
        }).to.not.throw();
    });
    it('should behave as expected', function() {
        expect(arthur).to.be.a.model2('person');
        expect(1).to.not.be.a.model2('person');
        expect(function() {
            expect(arthur).to.not.be.a.model2('person');
        }).to.throw();
        expect(function() {
            expect(1).to.be.a.model2('person');
        }).to.throw();
        expect(function() {
            expect(arthur).to.be.a.model2('animal');
        }).to.throw();
        expect(function() {
            expect(arthur).to.not.be.a.model2('animal');
        }).to.throw();
        expect(flagList).to.eql([undefined, true, true, undefined, undefined, true]);
    });
});

describe('Chainable method age', function() {
    it('should be successfully added', function() {
        expect(expect(new Model())).to.have.property('age').that.is.a('function');
        expect(function() {
            expect(expect(1)).to.have.property('age');
        }).to.not.throw();
    });
    it('should behave as expected', function() {
        expect(arthur).to.have.age(27);
        expect(arthur).to.have.age.above(17);
        expect(arthur).to.not.have.age.below(18);
    });
});
