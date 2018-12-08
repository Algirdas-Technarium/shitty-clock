const fs = require('fs');
const path = require('path');

const zero = Buffer.from('0');
const one = Buffer.from('1');

class Pin {
	dataFile(file) {
		return path.join(`/sys/class/gpio/gpio${this.id}/`, file);
	}

	constructor({ id, direction = 'out', activeLow = false }) {
		this.id = id;
		try {
			fs.writeFileSync('/sys/class/gpio/export', id);
		} catch (error) {

		}

		fs.writeFileSync(this.dataFile('direction'), direction);

		fs.writeFileSync(this.dataFile('active_low'), activeLow ? 1 : 0);
	}

	set value(value) {

		fs.writeFileSync(`/sys/class/gpio/gpio${this.id}/value`, value);
	}

	/* readValue() {
		const val = Number(fs.readFileSync(`/sys/class/gpio/gpio${this.id}/value`).toString('utf8'));
		// console.log('buffValue', val, typeof val);
		return val;
	} */

	flip() {
		const currentValue = Number(fs.readFileSync(`/sys/class/gpio/gpio${this.id}/value`).toString('utf8'));
		this.value = currentValue ? 0 : 1;
	}
}

module.exports = Pin;