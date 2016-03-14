#!/usr/bin/env node

const dgram = require('dgram');
const net = require('net');
const util = require('util');
const fs = require('fs');
const DATASTORE = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + "/.dmxdata/";

const args = require('optimist')
    
    .usage('Usage: $0 -p [tcpport] -h [host] -u [universe] -s [store] -c [constant] -l [listen] -t [trigger] -d [delay]')
    
    .boolean('v')

    .boolean('s')
    .alias('s', 'store')

    .boolean('c')
    .alias('c', 'constant')

    .boolean('t')
    .alias('t', 'trigger')
    
    .boolean('d')
    .alias('d', 'delay')
    .default('d', 500)

    .boolean('l')
    .alias('l', 'listen')

    .string('h')
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
    SEQ: [0x00],
    PHY: [0x00],
    UNIVERSE: [args.u, 0],
    LENGTH: [0x02, 0x00],

    EMPTYDATA: function() {
        return Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0)
    },
    DATA: Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0),

    SOCKET: dgram.createSocket("udp4"),

    HANDLER: function(data) {

        //TODO: Handle incoming;
        console.log(data);

    },
    SEND: function() {

        var data = DMX.HEADER.concat(DMX.SEQ).concat(DMX.PHY).concat(DMX.UNIVERSE).concat(DMX.LENGTH).concat(DMX.DATA);
        var buf = new Buffer(data);

        DMX.SOCKET.send(buf, 0, buf.length, DMX.PORT, DMX.HOST, function() {
            LOGGER.LOG(buf);
        });
    },
    WRITETIMER : null
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
        } else if( args.s ){
            if( DMX.WRITETIMER != null ){
                clearTimeout(DMX.WRITETIMER);
            }

            DMX.WRITETIMER = setTimeout(function(){
                fs.writeFile(DATASTORE + DMX.HOST + ".dat",JSON.stringify(DMX.DATA));
            },100);
        }


    }
};

if (args.s) {
    if (!fs.existsSync(DATASTORE)) {
        fs.mkdirSync(DATASTORE);
    }
    if( fs.existsSync(DATASTORE + DMX.HOST + ".dat") ){
        DMX.DATA = JSON.parse( fs.readFileSync(DATASTORE + DMX.HOST + ".dat") );
    }
}

if( args.c ){
    setInterval(DMX.SEND,1000/args.f);
}

DMX.SOCKET.on('error', LOGGER.ERROR);
TCP.SOCKET.on('error', LOGGER.ERROR);

if (args.l) {
    DMX.SOCKET.bind(DMX.PORT, function() {
        LOGGER.LOG('SOCKET BINDED TO PORT ' + DMX.PORT);
    });
    DMX.SOCKET.on('message', DMX.HANDLER);

} else {
    TCP.SOCKET.listen(TCP.PORT);
}
