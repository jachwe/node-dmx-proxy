const args = require('./opts.js').argv;
const dgram = require('dgram');
const LOGGER = require("./log.js");
const WS = require('./ws.js');
const tweenr = require('tweenr')();

var DMX = module.exports = {
    HOST: args.h,
    PORT: 6454,
    HEADER: [65, 114, 116, 45, 78, 101, 116, 0, 0, 80, 0, 14],
    SEQ: [0x00],
    PHY: [0x00],
    UNIVERSE: [args.u, 0],
    LENGTH: [0x02, 0x00],

    LASTPACKET: null,

    EMPTYDATA: function() {
        return Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0)
    },
    DATA: Array.apply(null, Array(512)).map(Number.prototype.valueOf, 0),

    SOCKET: dgram.createSocket("udp4"),

    HANDLER: function(data) {

        if (data.length < 20 || data == DMX.LASTPACKET) {
            return;
        }

        var TCP = require('./tcp.js');

        var sequence = data.readUInt8(12, true);
        var physical = data.readUInt8(13, true);
        var universe = data.readUInt8(14, true);
        var offset = data.readUInt8(16, true);
        var length = data.readUInt8(17, true);

        var rawData = [];

        for (i = 18; i < data.length; i++) {
            var value = data.readUInt8(i);
            var index = i - 18;

            var currentValue = DMX.DATA[index];
            DMX.DATA[index] = value;

            if (currentValue != value) {

                var str = (index + 1) + "=" + value;

                LOGGER.LOG("<<<<<" + str);
                TCP.EMIT(str);

            }

            rawData.push(value);

        }

        var packet = { sequence: sequence, physical: physical, universe: universe, offset: offset, length: length, data: rawData };
        WS.EMIT(JSON.stringify(packet));


        if (args.s) {
            if (DMX.WRITETIMER != null) {
                clearTimeout(DMX.WRITETIMER);
            }
            DMX.WRITETIMER = setTimeout(DMX.SAVE, 100);
        }

    },
    SEND: function() {

        var data = DMX.HEADER.concat(DMX.SEQ).concat(DMX.PHY).concat(DMX.UNIVERSE).concat(DMX.LENGTH).concat(DMX.DATA);
        var buf = new Buffer(data);
        DMX.SOCKET.send(buf, 0, buf.length, DMX.PORT, DMX.HOST, function() {
            DMX.LASTPACKET = buf;
        });
    },
    WRITETIMER: null,
    SAVE: function() {
        fs.writeFile(DATAFILE, JSON.stringify(DMX.DATA));
    },
    TWEEN: function(ch, val, time) {

        time /= 1000;

        var obj = { val : DMX.DATA[ch] };

        var tween = tweenr.to(obj, {
            val : val,
            duration : time,
            delay : 0
        });

        tween.on('update',function(e){
            DMX.DATA[ch] = Math.round( e.target.val );
            DMX.SEND();
        })
    }
}

DMX.SOCKET.on('error', LOGGER.ERROR);

DMX.SOCKET.bind(DMX.PORT, function() {
    LOGGER.LOG('UDP socket binded on port ' + DMX.PORT);
});

DMX.SOCKET.on('message', DMX.HANDLER);
