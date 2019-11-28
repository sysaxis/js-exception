"use strict";

const {assert} = require('chai');
const Promise = require('bluebird');


const Exception = require('..');

class Ex extends Exception {
    get TooBusy() {
        return this.create(1, 'TOO_BUZY')
    }

    get TooSlow() {
        return this.create(2, 'TOO_SLOW');
    }

    get TooSimple() {
        return this.create('WAY_TOO_SIMPLE');
    }

    get TooEasy() {
        return this.create(0);
    }
}

suite('Exception');

var ex;

test('exception defined with code and codename', function() {
    ex = new Ex().TooBusy();

    assert.strictEqual(ex.code, 1);
    assert.strictEqual(ex.codename, 'TOO_BUZY');
});

test('exception defined with codename only', function() {
    ex = new Ex().TooSimple();

    assert.strictEqual(ex.codename, 'WAY_TOO_SIMPLE');
});

test('exception defined with code only', function() {
    ex = new Ex().TooEasy();

    assert.strictEqual(ex.code, 0);
});

test('new Exception(error: Error)', function() {
    const error = new Error();
    ex = new Ex(error);

    assert.ownInclude(ex, error);
});

test('new Exception(error: String)', function() {
    const message = 'something bad happened';
    ex = new Ex(message);

    assert.ownInclude(ex, {message});
});

test('new Exception(error: Object)', function() {
    ex = new Ex({a: 1});

    assert.hasAllKeys(ex, ['message', 'stack']);
});

test ('new Exception(error: undefined)', function() {
    ex = new Ex();

    assert.hasAllKeys(ex, ['message', 'stack']);
});

test('creating with typed error name', function() {
    ex = new Ex().TooBusy();

    assert.ownInclude(ex, {
        code: 1,
        codename: 'TOO_BUZY'
    });
});

test('adding custom information', function() {
    ex = new Ex().TooBusy({
        waiting: true
    });

    assert.ownInclude(ex, {
        waiting: true
    });
});

test('long stack trace avoidance', function() {

    function throwsError() {
        var current = function() {
            var error = new Error('my error');
            throw new Ex(error).TooEasy();
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
                throw new Ex(err).TooEasy();
            }))))))));
    }

    return throwsPromiseError()
        .catch(error => {
            assert.equal(error.stack.split('node_modules').length, 1)
        });
});

test('#toString()', function() {
    ex = new Ex();

    assert.equal(ex.message || ex.codename, ex.toString());
});

test('#toObject()', function() {

    const message = 'timeout: task did not complete within limits';
    const error = new Error(message);

    const params = {
        speed: 2,
        accelerating: false
    };
    ex = new Ex(error).TooSlow(params);

    var obj = ex.toObject();
    
    assert.deepOwnInclude(obj, Object.assign({}, error, params, {
        code: 2,
        codename: 'TOO_SLOW'
    }));

    ex = new Ex(error).TooSlow(800);
    obj = ex.toObject();

    assert.deepOwnInclude(obj, Object.assign({}, error, {
        details: 800
    },{
        code: 2,
        codename: 'TOO_SLOW'
    }));

    ex = new Ex().TooSlow('800');
    obj = ex.toObject();

    assert.deepOwnInclude(obj, Object.assign({}, error, {
        code: 2,
        codename: 'TOO_SLOW',
        message: '800'
    }));
});

test('#toJSON()', function() {

    ex = new Ex();

    var json = ex.toJSON(true);
    var expected = `{"stack":"${ex.stack.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')}","message":""}`;

    var ex1 = JSON.parse(json);
    var ex2 = JSON.parse(expected);

    assert.deepEqual(ex1, ex2);
});

test('#deserialize(string: String)', function() {
    ex = new Ex();

    var obj = ex.toJSON(true);

    var ex2 = Ex.deserialize(obj);

    assert.instanceOf(ex2, Ex);
    assert.deepOwnInclude(ex, ex2);
});

test('#isException(error: any)', function() {
    ex = new Ex();

    assert.isTrue(Ex.isException(ex));
    assert.isNotTrue(Ex.isException(null));
});
