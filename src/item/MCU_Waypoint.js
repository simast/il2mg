/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Waypoint item
function MCU_Waypoint() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.Area = 0;
	this.Speed = 0;
	this.Priority = MCU_Waypoint.PRIORITY_MEDIUM;
}

MCU_Waypoint.prototype = Object.create(MCU.prototype);
MCU_Waypoint.prototype.typeID = 42;

// Waypoint priority constants
MCU_Waypoint.PRIORITY_LOW = 0;
MCU_Waypoint.PRIORITY_MEDIUM = 1;
MCU_Waypoint.PRIORITY_HIGH = 2;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Waypoint.prototype.toBinary = function(index) {

	var buffer = new Buffer(20);

	// Area (m)
	this.writeDouble(buffer, this.Area);

	// Speed (km/h)
	this.writeDouble(buffer, this.Speed);

	// Priority
	this.writeUInt32(buffer, this.Priority);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Waypoint;