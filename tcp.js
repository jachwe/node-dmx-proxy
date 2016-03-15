const args = require('./opts.js').argv;
const LOGGER = require("./log.js");
const net = require('net');
const WS = require('./dmx.js');

var TCP = module.exports = {
    PORT: args.p,
    SOCKET: net.createServer(function(tcpsocket) {
        tcpsocket.on('data', TCP.HANDLER);

        TCP.CLIENTS.push(tcpsocket);

        tcpsocket.on('end', function() {
            var idx = TCP.CLIENTS.indexOf(tcpsocket);
            if (idx > -1) {
                TCP.CLIENTS.splice(idx, 1);
            }
        })

    }),
    CLIENTS: [],
    HANDLER: function(str) {

        var DMX = require('./dmx.js');

        var packet = DMX.HEADER.concat(DMX.SEQ).concat(DMX.PHY).concat(DMX.UNIVERSE).concat(DMX.LENGTH);
        var data = args.t ? DMX.EMPTYDATA() : DMX.DATA;

        var r = /([0-9]+)=([0-9]+)([\*\!0-9]*)/g;
        var m;
        var c = 0;

        var str = str.toString();

        var tween = false;


        while ((m = r.exec(str))) {
            
            var channel = parseInt(m[1]) - 1;
            var value = Math.min(m[2],255);
            var mod = m[3];

            LOGGER.LOG(m[1] + " -> " + value + " " + mod);

            c++;

            if (mod.length > 0 && mod[0] == "*") {
                var time = mod.substr(1);
                DMX.TWEEN(channel, value, time);
            } else if (mod.length > 0 && mod[0] == "!") {
                var pulseback = data[channel];
                var timeout = mod.substr(1);
                data[channel] = value;
                setTimeout(function(ch,v){
                   DMX.DATA[ch] = v;
                   DMX.SEND(); 
                },timeout,channel,pulseback);

            } else {
                data[channel] = value;
            }
        }

        if (c < 1) {
            return;
        }

        if(!tween){
            DMX.DATA = data;
        }
        
        if (!args.c) {
            DMX.SEND();
        }

        if (args.s) {
            if (DMX.WRITETIMER != null) {
                clearTimeout(DMX.WRITETIMER);
            }

            DMX.WRITETIMER = setTimeout(DMX.SAVE, 100);
        }


    },
    EMIT: function(data) {
        LOGGER.LOG('>>>>>' + data);
        for (var i = 0; i < TCP.CLIENTS.length; i++) {
            TCP.CLIENTS[i].write(data + '\n');
        }
    }
}

TCP.SOCKET.on('error', LOGGER.ERROR);

TCP.SOCKET.listen(TCP.PORT, function() {
    LOGGER.LOG('Server listening on port ' + TCP.PORT);
});
