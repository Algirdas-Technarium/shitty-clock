const Pin = require('./Pin.js');
const roughtime = require('roughtime');
const moment = require('moment');
const path = require('path');
const localtunnel = require('localtunnel');
const express = require('express');
const spawnSync = require('child_process').spawnSync;
require('moment-timezone')

const serialHelper = require('./serial.js');

const stepper = new Pin({ id: 12 });
const direction = new Pin({ id: 11 });

const tickEverySeconds = 3600 / 141.25 / 8; // Full Step of the Servo
let currentClockTick = Math.floor(moment().valueOf() / 1000 / tickEverySeconds);
let desiredClockTick = null;
let clockCalibration = 0;
const finalClockTick = () => {
	if (desiredClockTick === null) {
		return null;
	}

	return desiredClockTick + clockCalibration;
};

const adjustClock = () => {
	if (finalClockTick() === null) {
		return;
	}

	if (currentClockTick === finalClockTick()) {
		return;
	}

	if (currentClockTick < finalClockTick()) {
		direction.value = 1;
		currentClockTick += 1;
	} else {
		direction.value = 0;
		currentClockTick -= 1;
	}

    stepper.flip();
    stepper.flip();
};

setInterval(adjustClock, 20);



let last = null;
serialHelper.on('data', (raw) => {
	data = raw.toString('utf8').trim();

	const back = 'FFE01F';
	const forward = 'FFA857';
	const repeat = 'FFFFFFFF';

	if (data === back) {
		last = back;
		clockCalibration -= 1;
		//console.log('Back');
	} else if (data === forward) {
		last = forward;
		clockCalibration += 1;
		//console.log('Forward');
	} else if (data === repeat) {
		if (last === back) {
			clockCalibration -= 1;
			//console.log('Back');
		} else if (last === forward) {
			clockCalibration += 1;
			//console.log('Forward');
		}
	}
});



{
	const app = express();
	const port = 8080;

	app.get('/calibration', (req, res) => {
		clockCalibration = Math.floor(req.query.seconds / tickEverySeconds);
		res.end("Thanks, you can go back now");
	});

	app.get('/', (req, res) => {
	  	res.sendFile(__dirname + '/index.html');
	});

	app.get('/timezone', (req, res) => {
		moment.tz.setDefault(req.query.timezone);
		console.log('set timezone', req.query.timezone);
		res.end('All good thanks')
	});

	app.get('/restart', (req, res) => {
		res.end('Restarting');
		spawnSync('systemctl', [
			'restart',
			'project'
		]);
	});

	app.get('/reboot', (req, res) => {
		res.end('Rebooting Orange Pi');
		spawnSync('reboot');	
	});

	app.get('/shutdown', (req, res) => {
		res.end('Shutting Down Orange Pi');
		spawnSync('reboot');	
	});

	app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}



const updateTime = (ms) => {
	desiredClockTick = Math.floor(moment().valueOf() / 1000 / tickEverySeconds);
};

setInterval(updateTime, 1000);
updateTime();