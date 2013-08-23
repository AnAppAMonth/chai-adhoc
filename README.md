Chai Adhoc
==========

*Chai*'s API is designed to be used by plugins, and not optimzied for ad-hoc
creation of custom assertions. This module simplifies *Chai*'s plugin API and
makes it easier to create new assertions or modify existing ones in an ad-hoc
way.

Do you find yourself creating functions to group tests and then use the function
to test multiple subjects? Consider creating a custom assertion instead! By
creating a custom assertion to accomplish tasks like this you gain the following
benefits:

1. Tests are uniform in style and easier to read.
2. Since it's just an assertion, you can call it at the middle of a chain.

Why don't people do this? Because it's easier to create a function than defining
a custom assertion. Not any more!


Install
=======

    npm install chai-adhoc


Examples
========

Below are examples from *Chai*'s plugin API documentation and their equivalents
written using *Chai Adhoc*.

Plugin API
----------

```js
var chai = require('chai');

chai.use(function (chai, utils) {
    var Assertion = chai.Assertion;

    Assertion.addProperty('model', function () {
        this.assert(
            this._obj instanceof Model
            , 'expected #{this} to be a Model'
            , 'expected #{this} to not be a Model'
        );
    });

    Assertion.addMethod('model', function (type) {
        var obj = this._obj;

        // first, our instanceof check, shortcut
        new Assertion(this._obj).to.be.instanceof(Model);

        // second, our type check
        this.assert(
            obj._type === type
            , "expected #{this} to be of type #{exp} but got #{act}"
            , "expected #{this} to not be of type #{act}"
            , type        // expected
            , obj._type   // actual
        );
    });

    Assertion.overwriteProperty('ok', function (_super) {
        return function checkModel () {
            var obj = this._obj;
            if (obj && obj instanceof Model) {
                new Assertion(obj).to.have.deep.property('_attrs.id'); // we always want this
                var assertId = new Assertion(obj._attrs.id);
                utils.transferFlags(this, assertId, false); // false means don't transfer `object` flag
                assertId.is.a('number');
            } else {
                _super.call(this);
            }
        };
    });
});
```

Chai Adhoc
----------

```js
var adhoc = require('chai-adhoc');

adhoc.addAssertion('model', function(ctx) {
    ctx.assert(
        ctx.obj instanceof Model
        , 'expected #{this} to be a Model'
        , 'expected #{this} to not be a Model'
    );
});

adhoc.addAssertion('model', function(ctx, type) {
    // first, our instanceof check, shortcut
    ctx.expect(ctx.obj).to.be.instanceof(Model);

    // second, our type check
    ctx.assert(
        ctx.obj._type === type
        , "expected #{this} to be of type #{exp} but got #{act}"
        , "expected #{this} to not be of type #{act}"
        , type            // expected
        , ctx.obj._type   // actual
    );
});

adhoc.extendAssertion('ok', function(ctx) {
    if (ctx.obj && ctx.obj instanceof Model) {
        ctx.expect(ctx.obj).to.have.deep.property('_attrs.id').flags().that.is.a('number');
        return true;
    }
});
```


Documentation
=============

This package contains 4 methods:

1.  `addAssertion()`

    Adds a new assertion, can be a property, a method, or a chainable method, depending
    on arguments passed to it.

    Arguments:
    * `name`. Name of the new assertion.
    * `func`. Function to implement the assertion. If this function takes only one
    argument (the context object), a property is created; otherwise a method is created.
    * `getter` **Optional**. Function to be called when the assertion is accessed as a property.
    If set, a chainable method is created.

    **More on `func`**

    This function should take one or more arguments. The first argument `ctx` is an
    object containg context variables and methods to help you implement the assertion.
    Its members include:
    * `obj`. The subject of the assertion.
    * `expect()`. Creates an assertion object. The difference between it and
    `chai.expect()` is that its returned assertion object has an extra method
    `flags()`, which can be called to transfer all or specified flags from `this`
    to this new assertion object.
    * `assert()`: an alias of `this.assert()`.
    * `flag()`: an alias of `utils.flag()`, with its first argument bound to `this`.

    Any additional arguments are considered params to the assertion function. For
    example, a property would take none, a method like `above()` would take 1, and
    a method like `within()` would take 2, etc.

    Inside `func`, `this` points to the assertion object on which this assertion is
    called, just like in *Chai*'s plugin API.

    **More on `getter`**

    This function is used when defining a chainable methods, to be called whenever
    the property is accessed. *Chai* officially recommends only setting flags in
    this function, so it takes only one argument: `flag`, which is an alias of
    `utils.flag()`, with its first argument bound to `this`.

2.  `addSimple()`

    Adds a simple assertion, can be either a property or a method, cannot be a
    chainable method.

    One of the biggest annoyances when implementing assertions is having to deal
    with the 'negate' flag. This is the biggest obstacle when trying to use custom
    assertions in place of your test functions.

    The philosophy of this method is: if we will never use the assertion with a
    'negate' flag anyway, why bother supporting it? Assertions defined using this
    method simply fail if the 'negate' flag is present.

    Otherwise it's the same as `addAssertion()`, other than the fact that it doesn't
    support creating chainable methods, and therefore only takes 2 arguments:
    `name` and `func`.

3.  `extendAssertion()`

    Extends an existing assertion, either a property or a method, cannot extend a
    chainable method, which is a restriction of *Chai*.

    It takes 2 arguments: `name` and `func`. `name` is the name of the assertion
    to extend, it must already exist.

    For `func`, see its description in `addAssertion()`'s section. There is one
    difference, though: its return value is important, **very important**, here.
    It must return truthy if the assertion has been evaluated for the subject, in
    which case work for this assertion is considered done; or falsy if it hasn't,
    in which case the original function for this assertion (`_super()`) is called.
    So you can extend an existing assertion and provide an alternative implementation
    only for some situations; in other situations, you return a falsy value and the
    default implementation of the assertion is used.

4.  `wrapAssertion()`

    Wraps an existing assertion, either a property or a method, cannot extend a
    chainable method, which is a restriction of *Chai*.

    Both this method and `extendAssertion()` calls *Chai*'s `overwriteProperty()`
    and `overwriteMethod()` API methods to overwrite existing assertions. So what
    is the difference?

    The difference is that `extendAssertion()` is called **before** `_super()` is called,
    to allow you handle certain types of operands differently than `_super()`; in contrast,
    this method is called **after** `_super()` is called, to allow you handle `_super()`'s
    result. For example, if `_super()` throws an error, you can modify its message, or
    even suppress it if so desired.

    It takes 2 arguments: `name` and `func`. `name` is the name of the assertion
    to wrap, it must already exist.

    For `func`, it's again similar to that described in `addAssertion()`'s section,
    but this time there are two differences:
    * Its first argument is `error`, which is either an error object if the assertion
    failed (remember the assertion is evaluated *before* calling this function), or
    `undefined` if the assertion succeeded. After this it takes `ctx` and any parameters
    passed to the assertion function, just like before.
    * The return value is **very important**. If it returns falsy, and if the assertion
    failed, the error object will be rethrown. Return truthy if you want to suppress the
    error, but **be careful not to** accidentally return truthy and suppress the error!

    So if the assertion failed, you have three choices in `func`:
    * Throw `error` (after perhaps changing its properties), or throw a new Error object.
    * Return falsy (after perhaps changing `error`'s properties).
    * Return truthy.

    In the first two cases, an error is thrown, the assertion fails; in the last case, the
    error is suppressed, and the assertion succeeds.


License
=======

MIT License
