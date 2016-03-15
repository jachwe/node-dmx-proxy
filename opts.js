const opt = require('optimist');

var opts = module.exports = opt.usage('Usage: $0 -vsctdlfhup')

.boolean('s')
    .alias('s', 'store')
    .describe('s', 'Enables storing data in local file')

.boolean('c')
    .alias('c', 'constant')
    .describe('c', 'Constanty send data every n milliseconds ( n specified by -f)')

.boolean('f')
    .alias('f', 'frequency')
    .default('f', 30)
    .describe('f', 'Frequency for Constant Mode (-c) in frames per second')

.alias('u', 'universe')
    .default('u', 0)
    .describe('u', 'DMX Universe to send and receive data')

.string('h')
    .alias('h', 'host')
    .default('h', "127.0.0.1")
    .describe('h', 'Address of the receiving Artnet node')

.default('p', 4040)
    .alias('p', 'port')
    .describe('p', 'TCP Port for sending and receiving data')

.boolean('v')
    .describe('v', 'Enables verbsose logging')

.boolean('help')
    .describe('help', 'Prints this help message')


if( opts.argv.w && opts.argv.w < 1024 ){
	opts.argv.w = 12345
}    