
var chai = require('chai'),
    Assertion = chai.Assertion,
    utils;

chai.use(function (_chai, utilities) {
    utils = utilities;
});

/**
 * Function provided by the user in an `addAssertion` call.
 *
 * @callback addAssertionCallback
 * @param {*} obj - Subject of the assertion
 * @param {function} assert - Function to assert conditions or create assertion objects.
 * @param {function} flag - Function to get and set flags.
 * @returns {function} Function to be used for the new assertion.
 */

/**
 * Getter provided by the user in an `addAssertion` call.
 *
 * @callback getterCallback
 * @param {function} flag - Function to get and set flags.
 */

/**
 * Callback provided by the user in an `wrapAssertion` call.
 *
 * @callback wrapAssertionCallback
 * @param {*} obj - Subject of the assertion
 * @param {function} assert - Function to assert conditions or create assertion objects.
 * @param {function} flag - Function to get and set flags.
 * @param {function} super - F
 */

var flag = function(name, value) {
    if (arguments.length >= 2) {
        return utils.flag(this, name, value);
    } else {
        return utils.flag(this, name);
    }
};

var assert = function(expr, msg, neg_msg, expected, actual) {
    if (neg_msg) {
        // Should call this.assert().
        return this.assert(expr, msg, neg_msg, expected, actual);
    } else {
        // Should create new `Assertion`.
        var ass = new Assertion(expr, msg);
        if (ass.flags === undefined) {
            var that = this;
            ass.flags = function() {
                if (arguments.length === 0) {
                    // Transfer all flags.
                    utils.transferFlags(that, ass, false);
                } else {
                    // Only transfer the specified flags.
                    for (var i = 0; i < arguments.length; i++) {
                        utils.flag(ass, arguments[i], utils.flag(that, arguments[i]));
                    }
                }
                return ass;
            };
        }
        return ass;
    }
};

/**
 * Add a new assertion.
 *
 * @param {string} name - Name of the new assertion.
 * @param {addAssertionCallback} func - Function to be called to define the assertion.
 * @param {getterCallback} getter - Function to be called when the assertion is accessed
 *                                  as a property. If set, a chainable method is created.
 */
function addAssertion(name, func, getter) {
    // First make sure an assertion with this name doesn't already exist.
    var ass = new Assertion(1);
    if (ass[name] !== undefined) {
        throw new TypeError('Assertion "' + name + '" already exists');
    }

    var method, getterWrapper;

    if (getter) {
        method = 'addChainableMethod';
        getterWrapper = function() {
            return getter(flag.bind(this));
        }
    } else {
        // Call the function to see how many parameters its returned function expects.
        // This decides whether we should add a property or a method.
        var test = func(1, assert, flag);
        method = test.length ? 'addMethod' : 'addProperty';
    }

    return Assertion[method](name, function() {
        var fn = func(this._obj, assert.bind(this), flag.bind(this));
        return fn.apply(this, arguments);
    }, getterWrapper);
}

function extendAssertion() {

}

function wrapAssertion() {

}

module.exports = {
    addAssertion: addAssertion,
    extendAssertion: extendAssertion,
    wrapAssertion: wrapAssertion
};
