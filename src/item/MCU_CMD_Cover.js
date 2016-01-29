/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Cover command item
class MCU_CMD_Cover extends MCU {
	
	constructor() {
		super();
		
		this.CoverGroup = 1;
		this.Priority = MCU_CMD_Cover.PRIORITY_MEDIUM;
	}
	
	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		
		yield* super.toBinary(index, 25);

		const buffer = new Buffer(5);

		// CoverGroup
		this.writeUInt8(buffer, this.CoverGroup);
		
		// Priority
		this.writeUInt32(buffer, this.Priority);

		yield buffer;
	}
}

// Cover command priority constants
MCU_CMD_Cover.PRIORITY_LOW = 0;
MCU_CMD_Cover.PRIORITY_MEDIUM = 1;
MCU_CMD_Cover.PRIORITY_HIGH = 2;

module.exports = MCU_CMD_Cover;