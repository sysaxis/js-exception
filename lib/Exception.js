"use strict";

const {removeModuleTraces} = require('./stacktrace');

class Exception extends Error {

    /**
     * Create a new Exception with given error
     * @param {*} error 
     */
    constructor(error) {
        super();

        var message, stack;

        if (error instanceof Error) {
            message = error.message;
            stack = error.stack;
        }
        else if (typeof(error) === 'string') {
            message = error;
            stack = this.stack;
        }
        else {
            message = this.message;
            stack = this.stack;
        }

        if (Exception.keepModuleTraces !== true) {
            stack = removeModuleTraces(stack)
        }

        var _error = {
            message, stack
        }

        Object.keys(_error).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                writable: true,
                value: _error[key]
            });
        });
    }

    create(code, codename) {

        if (typeof(code) === 'string' && !codename) {
            this.codename = code;
        }
        else if (Number.isInteger(code) && !codename) {
            this.code = code;
        }
        else {
            this.code = code || 0;
            this.codename = codename || 'NONE';
        }

        var This = this;
        return function(params) {
            if (typeof(params) === 'object') {
                Object.assign(This, params);
            }
            else {
                if (!This.message) {
                    This.message = params;
                }
                else {
                    This.details = params;
                }
            }

            return This;
        }
    }

    toString() {
        return this.message || this.codename;
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