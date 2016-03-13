#!/usr/bin/env node

const dgram = require('dgram');
const net = require('net');
const util = require('util');

const args = require('optimist')
    .usage('Usage: $0 -p [tcpport] -h [host] -u [universe] -s [store] -c [constant] -l [listen] -t [trigger] -d [delay]')
    .boolean('v')
    .boolean('s')
    .alias('s', 'store')
    .boolean('c')
    .alias('c', 'constant')
    .boolean('l')
    .alias('t', 'trigger')
    .boolean('t')
    .alias('d', 'delay')
    .boolean('d')
    .default('d', 500)
    .alias('l', 'listen')
    .alias('h', 'host')
    .default('h', "127.0.0.1")
    .alias('u', 'universe')
    .default('u', 0)
    .default('p', 4040)
    .alias('p', 'port')
    .argv;

const LOGGER = {
    LOG: function(msg) {
        if (args.v) {
            util.log(msg);
        }
    },
    ERROR: function(err) {
        util.log(err);
    }
}

const DMX = {
    HOST: args.h,
    PORT: 6454,
    HEADER: [65, 114, 116, 45, 78, 101, 116, 0, 0, 80, 0, 14],
    SEQ: [0],
    PHY: [0],
    UNIVERSE: [args.u, 0],
    LENGTH: [0x02, 0x00],

    EMPTYDATA: function() {
        return Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0)
    },
    DATA: Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0),

    SOCKET: dgram.createSocket("udp4"),

    HANDLER: function(data) {

    },
    SEND: function() {

        var data = DMX.HEADER.concat(DMX.UNIVERSE).concat(DMX.LENGTH).concat(DMX.DATA);
        var buf = new Buffer(data);

        DMX.SOCKET.send(buf, 0, buf.length, DMX.PORT, DMX.HOST, function() {
            LOGGER.LOG(buf);
        });
    }
};

const TCP = {
    PORT: args.p,
    SOCKET: net.createServer(function(tcpsocket) {
        tcpsocket.on('data', TCP.HANDLER);
    }),
    HANDLER: function(str) {

        var packet = DMX.HEADER.concat(DMX.SEQ).concat(DMX.PHY).concat(DMX.UNIVERSE).concat(DMX.LENGTH);
        var data = args.t ? DMX.EMPTYDATA() : DMX.DATA;

        var r = /([0-9]+)=([0-9]+)/g;
        var m;
        var c = 0;

        while ((m = r.exec(str.toString()))) {
            LOGGER.LOG(m[1] + " -> " + m[2]);
            var channel = parseInt(m[1]);
            var value = parseInt(m[2]);
            data[channel - 1] = value;
            c++;
        }

        if (c < 1) {
            return;
        }

        DMX.DATA = data;

        if (!args.c) {
            DMX.SEND();
        }

        if (args.t) {

            if (!args.c) {
                DMX.DATA = DMX.EMPTYDATA();
                setTimeout(DMX.SEND, args.d);
            } else {
                setTimeout(function() {
                    DMX.DATA = DMX.EMPTYDATA();
                }, args.d);
            }
        }
    }
};

DMX.SOCKET.on('error', LOGGER.ERROR);
TCP.SOCKET.on('error',LOGGER.ERROR);

if (args.l) {
    DMX.SOCKET.bind(DMX.PORT, function() {
        LOGGER.LOG('SOCKET BINDED TO PORT ' + DMX.PORT);
    });
    DMX.SOCKET.on('message', DMX.HANDLER);
    
} else {
    TCP.SOCKET.listen(TCP.PORT);
}