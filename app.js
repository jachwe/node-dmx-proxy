#!/usr/bin/env node

const fs = require('fs');
const DATASTORE = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + "/.dmxdata/";

const opt = require('./opts.js')
const args = opt.argv;

const DATAFILE = DATASTORE + args.h + ".dat";

const LOGGER = require("./log.js");

if (args.help) {
    opt.showHelp();
    process.exit(0);
}

const DMX = require('./dmx.js');
const TCP = require('./tcp.js');

if (args.s) {
    if (!fs.existsSync(DATASTORE)) {
        fs.mkdirSync(DATASTORE);
    }
    if (fs.existsSync(DATASTORE + DMX.HOST + ".dat")) {
        LOGGER.LOG('Reading stored data from ' + DATAFILE);
        DMX.DATA = JSON.parse(fs.readFileSync(DATAFILE));
    }
    LOGGER.LOG('Init Storing values to ' + DATAFILE);
}

if (args.t) {
    LOGGER.LOG("Trigger Mode is enabled.");
    LOGGER.LOG("Zero values will be sent " + args.d + "ms after setting.");
}

if( args.w ){
    var WS = require("./ws.js");
}

DMX.SOCKET.on('error', LOGGER.ERROR);
TCP.SOCKET.on('error', LOGGER.ERROR);

if (args.l) {
    LOGGER.LOG("Listening for Artnet Data.");
    LOGGER.LOG("Forwardind to TCP Port " + TCP.PORT + " on host " + args.h);
    DMX.SOCKET.bind(DMX.PORT, function() {
        LOGGER.LOG('UDP socket binded on port ' + DMX.PORT);
    });
    DMX.SOCKET.on('message', DMX.HANDLER);

} else {
    TCP.SOCKET.listen(TCP.PORT, function() {
        LOGGER.LOG('Server listening on port ' + TCP.PORT);
        LOGGER.LOG('Forwarding data to ' + DMX.HOST + ' on universe ' + args.u);
    });
}

if (args.c) {
    setInterval(DMX.SEND, 1000 / args.f);
    LOGGER.LOG('Constantly sending data with ' + args.f + ' FPS');
}
