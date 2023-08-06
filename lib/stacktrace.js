/**
 * Defines methods for working with stacktrace
 */

"use strict";

const path = require('path');

const EXEC_PATH = path.resolve('.');
const SHORT_EXEC_PATH = '.' + path.sep;
const NODE_MODULES_IDF = path.sep + 'node_modules' + path.sep;

module.exports = {
    removeModuleTraces
}

/**
 * Removes node_modules traces from stacktrace
 * @param {String} stack 
 * @returns {String}
 */
function removeModuleTraces(stack) {
    if (!stack) return '';

    var traces = stack
        .split(/\r?\n +at/g)
        .map(trace => {

            var tracePaths = /(.*) \(?([\d\D]+?)\)$/.exec(trace);
            if (tracePaths) {
                var invokation = tracePaths[1];
                var filepath = tracePaths[2];

                if (filepath.includes(NODE_MODULES_IDF)) {
                    return null;
                }

                var newStack = filepath.replace(EXEC_PATH, SHORT_EXEC_PATH);
                if (newStack.length === filepath.length) {
                    return null; // nodejs internal path
                }

                return invokation + ` (${newStack})`;
            }

            if (trace.includes(NODE_MODULES_IDF)) {
                return null;
            }

            return trace.replace(EXEC_PATH, SHORT_EXEC_PATH);
        })

    return traces.filter(t => t !== null).join('\n    at');
}
