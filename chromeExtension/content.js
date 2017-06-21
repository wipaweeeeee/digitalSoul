var socket = io.connect('https://ws1236.itp.io:8008');
// socket.connect();

var idleTime = 0;
var activeTime = 0;
var soulOnNoti = document.createElement('div');

var idleInterval = setInterval(timerIncrement, 1000);
// var activeInterval = setInterval(activeIncrement, 1000);

document.onmousemove = function(e) {
	idleTime = 0;
	// setInterval(activeIncrement, 1000);
	activeIncrement();

};

function activeIncrement() {
	activeTime++;
	if ( activeTime > 100) {
		soulOn();
		activeTime = 0;
	}
}

function timerIncrement() {
	idleTime++;
	if ( idleTime > 10) {
		soulOff();
		idleTime = 0;
	}
}

function soulOff() {
	console.log('soul off');
	socket.emit('soulOff', null);
}

function soulOn() {
	console.log('soul on');
	socket.emit('soulOn', null);

};

function soulAdded() {
	var gif = document.createElement('img');
	gif.src = chrome.extension.getURL('images/digitalSoul_sm.gif')

	gif.style.position = "absolute";
	gif.style.top = 0;
	gif.style.right = 0;
	gif.style.zIndex = 999;
	document.body.appendChild(gif);
}



