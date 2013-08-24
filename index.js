
var inspect = require('util').inspect;
var chai, utils, Assertion;
var registered = false;

var internals = ['constructor', 'assert'];
var getters = [
    'to',
    'be',
    'been',
    'is',
    'that',
    'and',
    'have',
    'with',
    'at',
    'of',
    'same'
];
var flags = ['not', 'deep', 'itself'];

function adhoc(_chai, _utils) {
    chai = _chai;
    utils = _utils;
    Assertion = chai.Assertion;
    if (chai && utils && Assertion) {
        registered = true;
    }
}

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


// Returns the type of a member on the assertion object's prototype, or false if it's
// not a member.
function getMemberType(member) {
    var obj = new Assertion(1),
        desc;

    // First check whether this is really a member of obj.__proto__
    /* jshint -W103 */
    desc = Object.getOwnPropertyDescriptor(obj.__proto__, member);
    if (desc) {
        if (member[0] === '_') {
            // This is obviously an internal member.
            return 'an internal member';
        } else {
            if (desc.writable !== undefined) {
                // This is a data property.
                // There are two possibilities here:
                // 1. an assertion method.
                // 2. an internal member.
                //
                // However it doesn't seem like we can differentiate them, so we just
                // maintain a list of internal members and search in the list.
                if (internals.indexOf(member) === -1) {
                    return 'an assertion method';
                } else {
                    return 'an internal member';
                }
            } else {
                // This is an accessor property.
                // There are four possibilities here:
                // 1. a chainable getter (like `to`, `be`, etc).
                // 2. a flag setter (like `not`, `deep`, etc).
                // 2. an assertion property.
                // 3. a chainable method.
                //
                // Chainable getters and flag setters are essentially assertion properties
                // that always succeed, so it's impossible to identify them programatically.
                // We maintain lists for them and search in the lists.
                //
                // To differentiate an assertion property and a chainable method:
                // 1. When accessing a chainable method, it sets a flag and returns a function.
                // 2. When accessing an assertion property, the assertion is evaluated, it
                //    either succeeds and returns an object, or fails and throws an exception.
                if (getters.indexOf(member) >= 0) {
                    return 'a chainable getter';
                } else if (flags.indexOf(member) >= 0) {
                    return 'a flag setter';
                } else {
                    // Either an assertion property or a chainable method.
                    var valid = true;
                    try {
                        if (typeof obj[member] === 'function') {
                            // This is a chainable method.
                            valid = false;
                        }
                    } catch (e) {}

                    if (valid) {
                        // This is an assertion property.
                        return 'an assertion property';
                    } else {
                        return 'a chainable method';
                    }
                }
            }
        }
    } else {
        // This isn't a member.
        return false;
    }
}

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
    // First make sure this plugin is already used.
    if (!registered) {
        throw new TypeError('Plugin not registered by calling chai.use() before being used');
    }

    // Make sure arguments are valid.
    if (typeof name !== 'string') {
        throw new TypeError('name is not a string');
    }
    if (typeof func !== 'function') {
        throw new TypeError('func is not a function');
    }

    // Make sure an assertion with this name doesn't already exist.
    if (getMemberType(name)) {
        throw new TypeError('Assertion "' + name + '" already exists');
    }

    var method, getterWrapper;

    if (getter) {
        if (typeof getter !== 'function') {
            throw new TypeError('getter is not a function');
        }

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
    // First make sure this plugin is already used.
    if (!registered) {
        throw new TypeError('Plugin not registered by calling chai.use() before being used');
    }

    // Make sure arguments are valid.
    if (typeof name !== 'string') {
        throw new TypeError('name is not a string');
    }
    if (typeof func !== 'function') {
        throw new TypeError('func is not a function');
    }

    // Make sure an assertion with this name doesn't already exist.
    if (getMemberType(name)) {
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
    // First make sure this plugin is already used.
    if (!registered) {
        throw new TypeError('Plugin not registered by calling chai.use() before being used');
    }

    // Make sure arguments are valid.
    if (typeof name !== 'string') {
        throw new TypeError('name is not a string');
    }
    if (typeof func !== 'function') {
        throw new TypeError('func is not a function');
    }

    // Check whether the assertion to be overwritten is a property or a method.
    var method,
        type = getMemberType(name);
    if (type) {
        if (type === 'an assertion method') {
            method = 'overwriteMethod';
        } else if (type === 'an assertion property') {
            method = 'overwriteProperty';
        } else {
            throw new TypeError('Member "' + name + '" is ' + type + ' and should not be overwritten');
        }
    } else {
        throw new TypeError('Assertion "' + name + '" doesn\'t exist');
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
    // First make sure this plugin is already used.
    if (!registered) {
        throw new TypeError('Plugin not registered by calling chai.use() before being used');
    }

    // Make sure arguments are valid.
    if (typeof name !== 'string') {
        throw new TypeError('name is not a string');
    }
    if (typeof func !== 'function') {
        throw new TypeError('func is not a function');
    }

    // Check whether the assertion to be overwritten is a property or a method.
    var method,
        type = getMemberType(name);
    if (type) {
        if (type === 'an assertion method') {
            method = 'overwriteMethod';
        } else if (type === 'an assertion property') {
            method = 'overwriteProperty';
        } else {
            throw new TypeError('Member "' + name + '" is ' + type + ' and should not be overwritten');
        }
    } else {
        throw new TypeError('Assertion "' + name + '" doesn\'t exist');
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

adhoc.addAssertion = addAssertion;
adhoc.addSimple = addSimple;
adhoc.extendAssertion = extendAssertion;
adhoc.wrapAssertion = wrapAssertion;
adhoc.format = format;

module.exports = adhoc;
