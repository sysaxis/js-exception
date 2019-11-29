"use strict";

const {removeModuleTraces} = require('./stacktrace');

class Exception extends Error {

    /**
     * Create a new Exception with given params
     */
    constructor(params, defaults) {
        super();

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
                message = arg.message;
                stack = arg.stack;
            }
            else if (typeof(arg) === 'string') {
                message = arg;
            }
            else if (typeof(arg) === 'object' && !Array.isArray(arg)) {
                Object.assign(target, arg);
            }
        }
        
        target.message = message || target.message || this.message;
        target.stack = stack || this.stack;

        if (Exception.keepModuleTraces !== true) {
            target.stack = removeModuleTraces(target.stack);
        }

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

        function exception() {
            var ex = new Exception([...arguments], defaults);
            ex[_symbol] = true;

            return ex;
        }

        Object.defineProperty(exception, Symbol.hasInstance, {
            value: function(instance) {
                return instance[_symbol] === true;
            }
        })
        
        exception._symbol = _symbol;

        return exception;
    }

    /**
     * 
     */
    create(params) {
        console.warn('Exception.prototype.create() will be deprecated. Please use a static method Exception.define() instead!');

        var Ex = Exception.define(params);
        var proto = this.prototype;

        return function(params) {
            var ex = new Ex(params);

            // assign derived class prototype for backwards compatibilty
            ex.prototype = proto; 

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
        var object = Object.assign({}, this);
        
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