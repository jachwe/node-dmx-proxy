const args = require('./opts.js').argv;
const LOGGER = require("./log.js");
const net = require('net');


var TCP = module.exports = {
    PORT: args.p,
    SOCKET: net.createServer(function(tcpsocket) {
        tcpsocket.on('data', TCP.HANDLER);
    }),
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
    EMIT : function(data){
    	var client = net.connect(args.p,args.h,function(){
    		client.end(data+'\n');
    	});
    	client.on("error",LOGGER.LOG);
    }
}