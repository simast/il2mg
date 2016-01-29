/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Waypoint item
class MCU_Waypoint extends MCU {
	
	constructor() {
		super();
		
		this.Area = 0;
		this.Speed = 0;
		this.Priority = MCU_Waypoint.PRIORITY_MEDIUM;
	}
	
	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		
		yield* super.toBinary(index, 42);

		const buffer = new Buffer(20);

		// Area (m)
		this.writeDouble(buffer, this.Area);

		// Speed (km/h)
		this.writeDouble(buffer, this.Speed);

		// Priority
		this.writeUInt32(buffer, this.Priority);

		yield buffer;
	}
}

// Waypoint priority constants
MCU_Waypoint.PRIORITY_LOW = 0;
MCU_Waypoint.PRIORITY_MEDIUM = 1;
MCU_Waypoint.PRIORITY_HIGH = 2;

module.exports = MCU_Waypoint;