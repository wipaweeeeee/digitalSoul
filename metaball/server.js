var https = require('https');
var fs = require('fs'); // Using the filesystem module
var url =  require('url');

var options = {
  key: fs.readFileSync('my-key.pem'),
  cert: fs.readFileSync('my-cert.pem')
};

function handleIt(req, res) {
	var parsedUrl = url.parse(req.url);

	var path = parsedUrl.pathname;
	if (path == "/") {
		path = "index.html";
	}

	fs.readFile(__dirname + path,

		// Callback function for reading
		function (err, fileContents) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + req.url);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(fileContents);
  		}
  	);	
	
	// Send a log message to the console
	console.log("Got a request " + req.url);
}

var httpServer = https.createServer(options, handleIt);
httpServer.listen(8008);

var io = require('socket.io').listen(httpServer);

io.sockets.on('connection', function (socket) {
	socket.on('soulOn', function() {
		console.log('connected to chrome');
		io.sockets.emit('soulOn');
	});

	socket.on('soulAdded', function (data) {
		console.log('a soul is added');
		io.sockets.emit('soulAdded', data);
	});

	socket.on('soulOff', function (data) {
		console.log('a soul left');
		io.sockets.emit('soulOff', data);
	});
});