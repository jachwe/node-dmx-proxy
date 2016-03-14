const args = require('./opts.js').argv;
const LOGGER = require("./log.js");
const net = require('net');


var TCP = module.exports = {
    PORT: args.p,
    SOCKET: net.createServer(function(tcpsocket) {
        tcpsocket.on('data', TCP.HANDLER);
    }),
    CONNECT: function() {

        if (TCP.CLIENT != null) {
            TCP.CLIENT.destroy();
        }
        if (TCP.WATCHER) {
            clearTimeout(TCP.WATCHER);
            TCP.WATCHER = null;
        }
        TCP.CLIENT = net.connect(args.p, args.h, function() {
            LOGGER.LOG("Connected Socket");
        })
        TCP.CLIENT.on("error", function(err) {
            LOGGER.LOG("Socket Error.");
            if(!TCP.ERRORHOLD){
            	TCP.ERRORHOLD = true;
            	LOGGER.LOG("Try to reconnect in 5 seconds");
            	setTimeout(function(){
            		TCP.CONNECT();
            		TCP.ERRORHOLD = null;
            	},5000)
            }
        })
        TCP.CLIENT.on("end", function(err) {
            LOGGER.LOG("Socket disconnected. Try to reconnect in 5 seconds...");
            TCP.WATCHER = setTimeout(TCP.CONNECT, 5000);
        });

    },
    HANDLER: function(str) {

        var DMX = require('./dmx.js');

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
        } else if (args.s) {
            if (DMX.WRITETIMER != null) {
                clearTimeout(DMX.WRITETIMER);
            }

            DMX.WRITETIMER = setTimeout(DMX.SAVE, 100);
        }


    },
    EMIT: function(data) {
        if (TCP.CLIENT != null) {
            TCP.CLIENT.write(data + "\n");
        }
    }
}

if (args.l) {
    TCP.CONNECT();
}
