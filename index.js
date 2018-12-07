const Pin = require('./Pin.js');
const roughtime = require('roughtime');
const moment = require('moment');
const path = require('path');
const localtunnel = require('localtunnel');
const express = require('express');
const spawnSync = require('child_process').spawnSync;
require('moment-timezone')

const stepper = new Pin({ id: 12 });
const direction = new Pin({ id: 11 });
const forwardButton = new Pin({ id: 199, direction: 'in', activeLow: true });
const backButton = new Pin({ id: 198, direction: 'in', activeLow: true });


// var NanoTimer = require('nanotimer');
// var timerObject = new NanoTimer();
// timerObject.setInterval(e, '', '1000u');


/* setInterval(() => {
	requiredStep = Math.floor(Math.random() * 282) + 1  
}, Math.floor(Math.random() * 1000) + 200); */



const stepsPerHour = 282;
const stepsPerFullSweep = stepsPerHour * 12;
let currentStep = 0;
let requiredStep = 0;

const stepClock = (dir) => {
	direction.value = dir;
	stepper.flip();
	stepper.flip();
};

const adjustClock = () => {
	// console.log(currentStep, requiredStep);
	if (currentStep == requiredStep) {
		return;
	}

	if (currentStep < requiredStep) {
		direction.value = 0;
		currentStep += 1;
	} else {
		direction.value = 1;
		currentStep -= 1;
	}

	if (currentStep > stepsPerFullSweep) {
		currentStep = 0;
	}

	if (currentStep <= 0) {
		currentStep = stepsPerFullSweep;
	}		

    stepper.flip();
    stepper.flip();
};

setInterval(adjustClock, 5);





let speed = 500;
let lastTimeout;
let buttonIsPressed = false;

const buttonStep = () => {
	if (!buttonIsPressed) {
		return;
	}

	const forward = forwardButton.readValue();
	const backward = backButton.readValue();
	if (forward) {
		stepClock(0);
	} else if (backward) {
		stepClock(1);
	}

	speed = Math.floor(speed - (speed / 8));
	if (speed < 10) {
		speed = 10;
	}

	lastTimeout = setTimeout(buttonStep, speed);	
};

setInterval(() => {
	const forward = forwardButton.readValue();
	const backward = backButton.readValue();
	if (forward || backward) {
		if (!buttonIsPressed) {
			buttonIsPressed = true;
			buttonStep();
		}
	} else {
		buttonIsPressed = false;
		speed = 500;
		if (lastTimeout) {
			clearTimeout(lastTimeout);
			lastTimeout = null;
		}
	}
}, 10)



const app = express();
const port = 8080;

app.get('/plus', (req, res) => {
	for (let i = 0; i <= req.query.val; i++) {
		stepClock(0);
	}
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

app.get('/minus', (req, res) => {
	for (let i = 0; i <= req.query.val; i++) {
		stepClock(1);
	}	
	res.end("Thanks, you can go back now");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))





let tunnel;
const setupTunnel = () => {
	tunnel = localtunnel(8080, {
		subdomain: 'laikrodis'
	}, function(err, tunnel) {
	    if (err) {
	    	console.log('tunnel fail');
	    	setupTunnel();
	    } else {
	    	console.log('tunnel success');

			tunnel.on('close', function() {
			    setupTunnel();
			});	    	
	    }
	});
}

setupTunnel();








// Interval to adjust clock state to the desired
/* setInterval(() => {
	if (currentClockState !== clockState) {
		incrementClock();
	}
}, 375); */


const updateTime = () => {
	roughtime('roughtime.cloudflare.com', (error, { midpoint }) => {
		if (error) {
			console.log(error);
			return;
		}

		const mom = moment(midpoint / 1000);

		const hour = mom.hour() >= 12 ? (mom.hour() - 12) : mom.hour();
		const minute = mom.minute();
		const second = mom.second();

		requiredStep = Math.floor((hour * stepsPerHour) + (minute / 60 * stepsPerHour) + (second / 60 / 60 * stepsPerHour));
	});
};

setInterval(updateTime, 2500);
updateTime();