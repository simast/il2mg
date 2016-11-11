/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Attack area command item
class MCU_CMD_AttackArea extends MCU {

	constructor() {
		super();

		this.AttackGround = 0;
		this.AttackAir = 0;
		this.AttackGTargets = 0;
		this.AttackArea = 1000;
		this.Time = 600; // 10 minutes
		this.Priority = MCU_CMD_AttackArea.PRIORITY_MEDIUM;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 20);

		const buffer = new Buffer(19);

		// AttackArea
		this.writeDouble(buffer, this.AttackArea);

		// AttackGround
		this.writeUInt8(buffer, this.AttackGround);

		// AttackAir
		this.writeUInt8(buffer, this.AttackAir);

		// AttackGTargets
		this.writeUInt8(buffer, this.AttackGTargets);

		// Time
		this.writeUInt32(buffer, this.Time);

		// Priority
		this.writeUInt32(buffer, this.Priority);

		yield buffer;
	}
}

// Attack area command priority constants
MCU_CMD_AttackArea.PRIORITY_LOW = 0;
MCU_CMD_AttackArea.PRIORITY_MEDIUM = 1;
MCU_CMD_AttackArea.PRIORITY_HIGH = 2;

module.exports = MCU_CMD_AttackArea;