
var chai = require('chai'),
    Assertion = chai.Assertion,
    utils;

chai.use(function (_chai, utilities) {
    utils = utilities;
});

/**
 * Function provided by the user in `addAssertion()` and `extendAssertion()` calls.
 *
 * @callback assertionCallback
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

        var that = this;
        var flags = function() {
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

        if (ass.flags === undefined) {
            ass.flags = flags;
        } else if (ass.adhocFlags === undefined) {
            ass.adhocFlags = flags;
        }
        return ass;
    }
};

/**
 * Add a new assertion.
 *
 * @param {string} name - Name of the new assertion.
 * @param {assertionCallback} func - Function to be called to define the assertion.
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
        };
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

/**
 * Extend an existing assertion.
 *
 * Note that the function returned by calling `func()`, the function to be used for
 * the extension of the assertion, must return a truthy value if it has implemented
 * the assertion for the subject; or a falsy value if the subject doesn't meet its
 * criteria and `_super()` should be called.
 *
 * TODO: the `adhoc.super` flag. If you use an assertion when extending it, your
 * extending function will be called recursively. This may or may not be what you
 * want, and may cause infinite recursion if not used carefully. This flag is
 * supposed to solve this problem. However, it's debatable how to best implement
 * it: if this flag is set, shall we start from the level below the current level
 * when this assertion is used later in that language chain, or shall we start
 * from the top level but omit the current level? I need to see real-world use
 * cases for this scenario before I can decide.
 *
 * @param {string} name - Name of the assertion to extend.
 * @param {assertionCallback} func - Function to be called to define the extension.
 */
function extendAssertion(name, func) {
    // Check whether the assertion to be overwritten is a property or a method.
    var ass = new Assertion(1),
        method;
    if (ass[name] === undefined) {
        throw new TypeError('Assertion "' + name + '" doesn\'t exist');
    } else {
        method = typeof ass[name] === 'function' ? 'overwriteMethod' : 'overwriteProperty';
    }

    return Assertion[method](name, function(_super) {
        return function() {
            var fn = func(this._obj, assert.bind(this), flag.bind(this));
            if (!fn.apply(this, arguments)) {
                _super.apply(this, arguments);
            }
        };
    });
}

/**
 * Wrap an existing assertion.
 *
 * The difference between this function and `extendAssertion()` is that `extendAssertion()`
 * is called before `_super()` is called, to allow you handle certain types of operands
 * differently than `_super()`; this function is called after `_super()` is called, to
 * allow you handle `_super()`'s result. For example, if `_super()` throws an error, you
 * can change its message, or even suppress it if so desired.
 *
 * If `_super()` throws an error and your supplied function returns a falsy value, the
 * error is automatically rethrown. The convention is to return false if you don't want
 * to handle this situation, or return true if you do. In the latter case, you must manually
 * rethrow the error unless you want to suppress it.
 *
 * @param {string} name - Name of the assertion to wrap.
 * @param {assertionCallback} func - Function to be called to define the wrapper.
 */
function wrapAssertion(name, func) {
    // Check whether the assertion to be overwritten is a property or a method.
    var ass = new Assertion(1),
        method;
    if (ass[name] === undefined) {
        throw new TypeError('Assertion "' + name + '" doesn\'t exist');
    } else {
        method = typeof ass[name] === 'function' ? 'overwriteMethod' : 'overwriteProperty';
    }

    return Assertion[method](name, function(_super) {
        return function() {
            var error;
            try {
                _super.apply(this, arguments);
            } catch (e) {
                error = e;
            }
            var fn = func(this._obj, assert.bind(this), flag.bind(this));
            var args = [].slice.call(arguments);
            args.unshift(error);
            if (!fn.apply(this, args)) {
                if (error) {
                    throw error;
                }
            }
        };
    });
}

module.exports = {
    addAssertion: addAssertion,
    extendAssertion: extendAssertion,
    wrapAssertion: wrapAssertion
};
