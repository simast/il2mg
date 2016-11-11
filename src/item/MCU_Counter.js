/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Counter item
module.exports = class MCU_Counter extends MCU {

	constructor() {
		super();

		this.Counter = 1;
		this.Dropcount = 0;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 43);

		const buffer = new Buffer(5);

		// Counter
		this.writeUInt32(buffer, this.Counter);

		// Dropcount
		this.writeUInt8(buffer, this.Dropcount);

		yield buffer;
	}
};