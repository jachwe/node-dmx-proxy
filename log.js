const util = require('util');
const args = require('./opts.js').argv;

var LOGGER = module.exports = {
    LOG: function(msg) {
        if (args.v) {
            util.log(msg);
        }
    },
    ERROR: function(err) {
        util.log(err);
    }
}