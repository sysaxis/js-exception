"use strict";

const {assert} = require('chai');


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

test('exception defined with code and codename', function() {
    const ex = new Ex().TooBusy();

    assert.strictEqual(ex.code, 1);
    assert.strictEqual(ex.codename, 'TOO_BUZY');
});

test('exception defined with codename only', function() {
    const ex = new Ex().TooSimple();

    assert.strictEqual(ex.codename, 'WAY_TOO_SIMPLE');
});

test('exception defined with code only', function() {
    const ex = new Ex().TooEasy();

    assert.strictEqual(ex.code, 0);
});

test('new Exception(error: Error)', function() {
    const error = new Error();
    const ex = new Ex(error);

    assert.ownInclude(ex, error);
});

test('new Exception(error: String)', function() {
    const message = 'something bad happened';
    const ex = new Ex(message);

    assert.ownInclude(ex, {message});
});

test('new Exception(error: Object)', function() {
    const ex = new Ex({a: 1});

    assert.hasAllKeys(ex, ['message', 'stack']);
});

test ('new Exception(error: undefined)', function() {
    const ex = new Ex();

    assert.hasAllKeys(ex, ['message', 'stack']);
});

test('creating with typed error name', function() {
    const ex = new Ex().TooBusy();

    assert.ownInclude(ex, {
        code: 1,
        codename: 'TOO_BUZY'
    });
});

test('adding custom information', function() {
    const ex = new Ex().TooBusy({
        waiting: true
    });

    assert.ownInclude(ex, {
        waiting: true
    });
});

test('#toString()', function() {
    const ex = new Ex();

    assert.equal(ex.message || ex.codename, ex.toString());
});

test('#toObject()', function() {

    const message = 'timeout: task did not complete within limits';
    const error = new Error(message);

    const params = {
        speed: 2,
        accelerating: false
    };
    const ex = new Ex(error).TooSlow(params);

    const obj = ex.toObject();
    
    assert.deepOwnInclude(obj, Object.assign(error, params, {
        code: 2,
        codename: 'TOO_SLOW'
    }));
});

test('#toJSON()', function() {

    const ex = new Ex();

    var json = ex.toJSON(true);
    var expected = `{"stack":"${ex.stack.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')}","message":""}`;

    var ex1 = JSON.parse(json);
    var ex2 = JSON.parse(expected);

    assert.deepEqual(ex1, ex2);
});

test('#deserialize(string: String)', function() {
    var ex = new Ex();

    var obj = ex.toJSON(true);

    var ex2 = Ex.deserialize(obj);

    assert.instanceOf(ex2, Ex);
    assert.deepOwnInclude(ex, ex2);
});

test('#isException(error: any)', function() {
    var ex = new Ex();

    assert.isTrue(Ex.isException(ex));
    assert.isNotTrue(Ex.isException(null));
});
