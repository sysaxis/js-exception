"use strict";

const Mocha = require('mocha');

const test = new Mocha({
    timeout: false,
    ui: "qunit"
});

test.addFile('./test/tests.js');

test.run(function(failures) {
    process.exitCode = failures ? 1 : 0;
    process.exit();
});
