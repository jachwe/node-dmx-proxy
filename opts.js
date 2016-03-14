const opt = require('optimist');

var opts = module.exports = opt.usage('Usage: $0 -vsctdlfhup')

.boolean('s')
    .alias('s', 'store')
    .describe('s', 'Enables storing data in local file')

.boolean('l')
    .alias('l', 'listen')
    .describe('l', 'Receive Artnet data and forward to TCP port')

.boolean('c')
    .alias('c', 'constant')
    .describe('c', 'Constanty send data every n milliseconds ( n specified by -f)')

.boolean('f')
    .alias('f', 'frequency')
    .default('f', 30)
    .describe('f', 'Frequency for Constant Mode (-c) in frames per second')

.boolean('t')
    .alias('t', 'trigger')
    .describe('t', 'Enables Trigger Mode. Zero values will be send n milliseconds after setting (n specified by -d)')

.boolean('d')
    .alias('d', 'delay')
    .default('d', 500)
    .describe('d', 'Delay for Trigger Mode (-t)')

.alias('u', 'universe')
    .default('u', 0)
    .describe('u', 'DMX Universe to send and receive data')

.string('h')
    .alias('h', 'host')
    .default('h', "127.0.0.1")
    .describe('v', 'Address of the receiving Artnet node')

.default('p', 4040)
    .alias('p', 'port')
    .describe('p', 'TCP Port for sending and receiving data')

.default('w', 12345)
    .alias('w', 'websockets')
    .describe('w', 'Enables additional websockets Server. Optionally pass port')

.boolean('v')
    .describe('v', 'Enables verbsose logging')

.boolean('help')
    .describe('help', 'Prints this help message')