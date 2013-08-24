
var inspect = require('util').inspect,
    chai = require('chai'),
    Assertion = chai.Assertion,
    utils;

chai.use(function (_chai, utilities) {
    utils = utilities;
});

/**
 * Function provided by the user in an `addAssertion()` call.
 *
 * @callback addAssertionCallback
 * @param {Object} ctx - An object containg context variables and methods to help you
 *                       implement the assertion. Its members include:
 *                       1. `obj`: the subject of the assertion
 *                       2. `expect()`: start Chai language chains. The difference between
 *                                      it and `chai.expect()` is that its returned assertion
 *                                      object has an extra method `flags()`, which can be
 *                                      called to transfer all or specified flags from the
 *                                      language chain in which this new assertion is called,
 *                                      to this chain.
 *                       3. `assert()`: an alias of `this.assert()`.
 *                       4. `flag()`: an alias of `utils.flag()`, with its first argument
 *                                    bound to `this`.
 * @param {...*} [args] - Arguments to the assertion function. For properties, there should
 *                        be none; for methods, there should be at least one.
 */

/**
 * Getter provided by the user in an `addAssertion()` call.
 *
 * @callback getterCallback
 * @param {function} flag - Function to get and set flags.
 */

/**
 * Function provided by the user in an `extendAssertion()` call.
 *
 * @callback extendAssertionCallback
 * @param {Object} ctx - See `addAssertionCallback`.
 * @param {...*} [args] - See `addAssertionCallback`. But unlike `addAssertion()`,
 *                        this doesn't decide whether we overwrite a property or a
 *                        method: it depends on whether the existing member with the
 *                        given name is a property or a method.
 * @returns {boolean} Must return truthy if the assertion has been evaluated for the
 *                    subject, or falsy if it hasn't, in which case `_super()` is called.
 */

/**
 * Function provided by the user in a `wrapAssertion()` call.
 *
 * @callback wrapAssertionCallback
 * @param {Object|undefined} error - Either an error object if the assertion failed, or
 *                                   undefined if the assertion succeeded.
 * @param {Object} ctx - See `addAssertionCallback`.
 * @param {...*} [args] - Arguments passed to the assertion function.
 * @returns {boolean} If returns falsy, and if the assertion failed, the error object will
 *                    be rethrown. Return truthy if you want to suppress the error.
 *                    BE CAREFUL not to accidentally return truthy and suppress the error!
 */


// Create a new `Assertion` with an extra `flags()` method.
var expect = function(expr, msg, neg_msg, expected, actual) {
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
};

/**
 * Add a new assertion.
 *
 * @param {string} name - Name of the new assertion.
 * @param {addAssertionCallback} func - Function to implement the assertion. If this function
 *                                   takes only one argument (the context object), a property
 *                                   is created; otherwise a method is created.
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
            return getter(utils.flag.bind(utils, this));
        };
    } else {
        method = func.length > 1 ? 'addMethod' : 'addProperty';
    }

    return Assertion[method](name, function() {
        var ctx = {
            obj: this._obj,
            expect: expect.bind(this),
            assert: this.assert.bind(this),
            flag: utils.flag.bind(utils, this)
        };
        var args = [].slice.call(arguments);
        args.unshift(ctx);
        return func.apply(this, args);
    }, getterWrapper);
}

/**
 * Add a simple assertion.
 *
 * Simple assertions don't take the `negate` flag into consideration: they
 * simply fail if the flag is present. These assertions are simple to write,
 * and a good replacement for test functions that are created to reuse a group
 * of tests on different subjects.
 *
 * @param {string} name - Name of the new assertion.
 * @param {addAssertionCallback} func - Function to implement the assertion. If this function
 *                                   takes only one argument (the context object), a property
 *                                   is created; otherwise a method is created.
 */
function addSimple(name, func) {
    // First make sure an assertion with this name doesn't already exist.
    var ass = new Assertion(1);
    if (ass[name] !== undefined) {
        throw new TypeError('Assertion "' + name + '" already exists');
    }

    var method = func.length > 1 ? 'addMethod' : 'addProperty';

    return Assertion[method](name, function() {
        if (utils.flag(this, 'negate')) {
            throw new Error("The 'negate' flag is used with a simple assertion '" + name + "'");
        }

        var ctx = {
            obj: this._obj,
            expect: expect.bind(this),
            assert: this.assert.bind(this),
            flag: utils.flag.bind(utils, this)
        };
        var args = [].slice.call(arguments);
        args.unshift(ctx);
        return func.apply(this, args);
    });
}

/**
 * Extend an existing assertion.
 *
 * NOTE that `func()` must return a truthy value if it has implemented the
 * assertion for the subject; or a falsy value if the subject doesn't meet its
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
 * @param {extendAssertionCallback} func - Function to implement the extension.
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
            var ctx = {
                obj: this._obj,
                expect: expect.bind(this),
                assert: this.assert.bind(this),
                flag: utils.flag.bind(utils, this)
            };
            var args = [].slice.call(arguments);
            args.unshift(ctx);
            if (!func.apply(this, args)) {
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
 * @param {wrapAssertionCallback} func - The wrapper function.
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

            var ctx = {
                obj: this._obj,
                expect: expect.bind(this),
                assert: this.assert.bind(this),
                flag: utils.flag.bind(utils, this)
            };
            var args = [].slice.call(arguments);
            args.unshift(ctx);
            args.unshift(error);
            if (!func.apply(this, args)) {
                if (error) {
                    throw error;
                }
            }
        };
    });
}

function format(fmt/*, arguments*/) {
    var args = arguments;
    return fmt.replace(/#{(\d+)}/g, function(match, number) {
        return number > 0 && number < args.length ?
                inspect(args[number]) :
                match;
    });
}

module.exports = {
    addAssertion: addAssertion,
    addSimple: addSimple,
    extendAssertion: extendAssertion,
    wrapAssertion: wrapAssertion,
    format: format
};
