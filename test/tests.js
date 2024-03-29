"use strict";

const {assert, expect} = require('chai');
const Promise = require('bluebird');


const Exception = require('..');

const Exs = {
    TooBuzy: Exception.define({
        codename: 'TOO_BUZY',
        message: 'I am a default error message'
    }),
    TooSlow: Exception.define({codename: 'TOO_SLOW'}),
    TooSimple: Exception.define({codename: 'TOO_SIMPLE'})
}

suite('Exception');

var ex;

test('exception defined with custom params', function() {
    ex = new Exs.TooBuzy();
    assert.strictEqual(ex.codename, 'TOO_BUZY');
    assert.strictEqual(ex.message, 'I am a default error message');
});

test('new Exception(error: Error)', function() {
    const error = new Error();
    ex = new Exception(error);

    assert.ownInclude(ex, error);
});

test('new Exception(error: String)', function() {
    const message = 'something bad happened';
    ex = new Exception(message);

    assert.ownInclude(ex, {message});
    assert.isTrue(ex.stack.startsWith('Error: ' + message + '\n'))
});

test('new Exception(error: Object)', function() {
    var obj = {a: 1};
    ex = new Exception(obj);

    assert.ownInclude(ex, obj);
    assert.equal(ex.message, '');
});

test('new Exception(...arguments)', function() {
    const error = new Error();
    const message = 'something bad happened';
    const params = {a: 1};

    ex = new Exception(error, message, params);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);

    ex = new Exception(message, params, error);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);

    ex = new Exception(params, message);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);

    ex = new Exs.TooSimple(error, message, params);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);
    
    ex = new Exs.TooSimple(message, params, error);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);

    ex = new Exs.TooSimple(params, message);
    assert.ownInclude(ex, params);
    assert.equal(ex.message, message);
})

test('new Exception(error: undefined)', function() {
    ex = new Exception();

    assert.equal(ex.message, '');
    assert.isTrue(ex.stack.startsWith('Error\n'))
});

test('long stack trace avoidance', function() {

    function throwsError() {
        var current = function() {
            var error = new Error('my error');
            throw new Exception(error, {
                a: 1
            });
        }
    
        var fstack = [current];
        var i = 0;
        while(i++ < 20) {
            function next() {
                fstack.pop()();
            }
    
            fstack.push(next);
        }
    
        return fstack[fstack.length - 1]();
    }

    try {
        throwsError();
    }
    catch(error) {
        assert.equal(error.stack.split('node_modules').length, 1);
    }

    function throwsPromiseError() {
        return Promise
            .try(() =>
            Promise.try(() => 
            Promise.try(() => 
            Promise.try(() =>
            Promise.try(() =>
            Promise.try(() =>
            Promise.try(() =>
            Promise.try(() => {
                var err = new Error('my error');
                throw new Exception(err, {a: 2});
            }))))))));
    }

    return throwsPromiseError()
        .catch(error => {
            assert.equal(error.stack.split('node_modules').length, 1)
        });
});

test('type checks with instanceof', function() {
    var ex1 = new Exs.TooSimple();
    var ex3 = new Exception();

    assert.isTrue(ex1 instanceof Exs.TooSimple);
    assert.isTrue(ex1 instanceof Exception);
    assert.isFalse(ex1 instanceof Exs.TooBuzy);

    assert.isTrue(ex3 instanceof Exception);
    assert.isFalse(ex3 instanceof Exs.TooSimple);
})

test('catching exception with Promises', function() {
    return Promise
        .try(() => {
            return Promise
                .try(() => {
                    throw new Exs.TooSimple()
                })
                .catch(Exs.TooSimple, error => {
                    assert.ok(error);
                })
                .catch(error => {
                    expect.fail('error should have been caught by filter');
                })
        })
        .then(() => {
            var err = new Exs.TooBuzy();
            return Promise
                .try(() => {
                    throw err;
                })
                .catch(Exs.TooSimple, error => {
                    throw new Error('error was caught by the wrong filter');
                })
                .catch(error => {
                    if (error !== err) {
                        expect.fail(error.message);
                    }
                })
        })
        .then(() => {
            class CustomError extends Error {}

            var err = new Exs.TooSimple();
            return Promise
                .try(() => {
                    throw err;
                })
                .catch(CustomError, error => {
                    throw new Error('error should not have been caught by filter');
                })
                .catch(error => {
                    if (error !== err) {
                        expect.fail(error.message);
                    }
                })
        })
})

test('instance params should not mix', function() {
    var ex1 = new Exs.TooSimple({
        param1: 'value1'
    })

    assert.exists(ex1.param1)

    var ex2 = new Exs.TooSimple({
        param2: 'value2'
    })

    assert.exists(ex2.param2)
    assert.notExists(ex2.param1)
})

test('#toString()', function() {
    ex = new Exception();

    assert.equal('', ex.toString());
});

test('#toObject()', function() {

    const message = 'timeout: task did not complete within limits';
    const error = new Error(message);

    const params = {
        speed: 2,
        accelerating: false
    };
    ex = new Exs.TooSlow(error, params);

    var obj = ex.toObject();
    
    assert.deepOwnInclude(obj, Object.assign({}, error, params, {
        codename: 'TOO_SLOW'
    }));

    ex = new Exception(error, {codename: 'TOO_SLOW'});
    obj = ex.toObject();

    assert.deepOwnInclude(obj, Object.assign({}, error, {
        codename: 'TOO_SLOW'
    }));
});

test('#toJSON()', function() {

    ex = new Exception();

    var json = ex.toJSON(true);
    var expected = `{"stack":"${ex.stack.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')}","message":""}`;

    var ex1 = JSON.parse(json);
    var ex2 = JSON.parse(expected);

    assert.deepEqual(ex1, ex2);
});

test('#deserialize(string: String)', function() {
    ex = new Exception();

    var obj = ex.toJSON(true);

    var ex2 = Exception.deserialize(obj);

    assert.instanceOf(ex2, Exception);
    assert.deepOwnInclude(ex, ex2);
});

test('#isException(error: any)', function() {
    ex = new Exception();

    assert.isTrue(Exception.isException(ex));
    assert.isNotTrue(Exception.isException(null));
});

test('#is(error)', function() {
    ex = new Exs.TooSimple();

    assert.isTrue(ex.is(Exs.TooSimple));
    assert.isFalse(ex.is(Exs.TooBuzy));
    assert.isFalse(ex.is(Exception));
})
