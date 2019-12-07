"use strict";

const {removeModuleTraces} = require('./stacktrace');

class Exception extends Error {

    /**
     * Create a new Exception with given params
     */
    constructor(params, defaults) {
        var args, target, message, stack;

        if (Array.isArray(params)) {
            args = params;
            target = defaults || {};
        }
        else {
            args = [...arguments];
            target = {};
        }

        for(var arg of args) {
            if (arg instanceof Error) {
                message = message || arg.message;
                stack = arg.stack;
            }
            else if (typeof(arg) === 'string') {
                message = arg;
            }
            else if (typeof(arg) === 'object' && !Array.isArray(arg)) {
                Object.assign(target, arg);
            }
        }
        
        target.message = message || target.message || '';
        super(target.message);

        target.stack = stack || this.stack;
        if (Exception.keepModuleTraces !== true) {
            target.stack = removeModuleTraces(target.stack);
        }

        this.stack = target.stack;

        delete target.message;
        delete target.stack;

        Object.keys(target).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                writable: true,
                value: target[key]
            });
        })
    }

    /**
     * Define a unique error constructor with given defaults
     * @param {Object} [defaults] 
     */
    static define(defaults) {
        var _symbol = Symbol();

        class Ex extends Exception {
            constructor() {
                super([...arguments], defaults);

                // instance property with _symbol name for instanceof checks
                Object.defineProperty(this, _symbol, {
                    enumerable: false,
                    value: true
                })
            }
        }

        // hasInstance symbol for instanceof checks 
        Object.defineProperty(Ex, Symbol.hasInstance, {
            enumerable: false,
            value: function(instance) {
                return instance[_symbol] === true;
            }
        })

        // class property for identifying with is() method
        Object.defineProperty(Ex, '_symbol', {
            enumerable: false,
            value: _symbol
        })

        return Ex;
    }

    /**
     * DEPRECATED
     */
    create(params) {
        console.warn('Exception.prototype.create() will be deprecated. Please use a static method Exception.define() instead!');

        var Ex = Exception.define(params);

        return function(params) {
            var ex = new Ex(params);

            return ex;
        }
    }

    is(error) {
        // same as (this instanceof error)
        return this[error._symbol] === true;
    }

    toString() {
        return this.message;
    }

    toObject(includeStacktrace) {
        var object = {};
        Object.getOwnPropertyNames(this).forEach(prop => {
            object[prop] = this[prop];
        })
        
        if (!includeStacktrace) {
            delete object.stack;
        }

        return object;
    }

    toJSON(includeStacktrace) {
        return JSON.stringify(this.toObject(includeStacktrace));
    }

    static isException(error) {
        return error instanceof Exception;
    }

    static deserialize(string) {
        var object = JSON.parse(string);

        object.__proto__ = this.prototype;

        return object;
    }
}

module.exports = Exception;