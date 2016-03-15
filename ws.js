const WebSocketServer = require('ws').Server;
const LOGGER = require("./log.js");
const TCP = require('./tcp.js');
const args = require('./opts.js').argv;

var WS = module.exports = {
    SERVER: new WebSocketServer({ port: 8081 }),
    EMIT: function broadcast(data) {
        WS.SERVER.clients.forEach(function each(client) {
            client.send(data);
        });
    },
    HANDLER: function(data) {
    	if( !args.l ){
        	TCP.HANDLER(data.toString());
        }
    },
    PUSH : function(client){

        var DMX = require('./dmx.js');

        var rawData = DMX.DATA;

        var packet = { sequence: DMX.SEQ, physical: DMX.PHY, universe: DMX.UNIVERSE, data: rawData };
        client.send(JSON.stringify(packet));
    }
}

WS.SERVER.on('connection', function connection(ws) {
    LOGGER.LOG('Websocket client connected')
    ws.on('message', WS.HANDLER );
    WS.PUSH(ws);
});

WS.SERVER.on('error', LOGGER.ERROR);
