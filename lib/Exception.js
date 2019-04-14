"use strict";

class Exception extends Error {

    /**
     * Create a new Exception with given error
     * @param {*} error 
     */
    constructor(error) {
        super();

        var This = this;
        var _error;

        if (error instanceof Error) {
            _error = {
                message: error.message,
                stack: error.stack
            };
        }
        else if (typeof(error) === 'string') {
            _error = {
                message: error
            };
        }
        else {
            _error = {
                message: this.message,
                stack: this.stack
            }
        }

        Object.keys(_error || {}).forEach(key => {
            Object.defineProperty(This, key, {
                enumerable: true, 
                value: _error[key]
            });
        });
    }

    create(code, codename) {
        var This = this;

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

        return function(params) {
            Object.assign(This, params);

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

    static IsException(error) {
        return error instanceof Exception;
    }

    static deserialize(string) {
        var object = JSON.parse(string);

        var t = this;
        object.__proto__ = t.prototype;

        return object;
    }
}

module.exports = Exception;