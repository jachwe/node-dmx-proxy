const WebSocketServer = require('ws').Server;
const LOGGER = require("./log.js");
const TCP = require('./tcp.js');
const args = require('./opts.js').argv;

var WS = module.exports = {
    SERVER: new WebSocketServer({ port: args.w }),
    EMIT: function broadcast(data) {
        WS.SERVER.clients.forEach(function each(client) {
            client.send(data);
        });
    },
    HANDLER: function(data) {
    	if( !args.l ){
        	TCP.HANDLER(data.toString());
        }
    }
}

WS.SERVER.on('connection', function connection(ws) {
    LOGGER.LOG('Websocket client connected')
    ws.on('message', WS.HANDLER );
});

WS.SERVER.on('error', LOGGER.ERROR);
