const SerialPort = require('serialport');

const serialport = new SerialPort('/dev/ttyUSB0', {
	baudRate: 9600
});

module.exports = serialport;

/* serialport.on('data', function (data) {
  console.log('Data:', data.toString('utf8').trim());
}) */

