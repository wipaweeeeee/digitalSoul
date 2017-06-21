var serverSocket = require('socket.io-client')('http://ws1236.itp.io:8008');
// var io = require('socket.io')(http);

serverSocket.on('connect', function() {
	console.log('connected');
	socket.emit('soulOn');
});

