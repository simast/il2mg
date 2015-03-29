/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Waypoint item
function MCU_Waypoint() {

}

MCU_Waypoint.prototype = Object.create(MCU.prototype);
MCU_Waypoint.prototype.typeID = 42;

// Waypoint priority constants
var priority = MCU_Waypoint.priority = {
	LOW: 0,
	MEDIUM: 1,
	HIGH: 2
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Waypoint.prototype.toBinary = function(index) {

	var buffer = new Buffer(20);

	// Area (m)
	this.writeDouble(buffer, this.Area || 0);

	// Speed (km/h)
	this.writeDouble(buffer, this.Speed || 0);

	// Priority
	this.writeUInt32(buffer, this.Priority !== undefined ? this.Priority : priority.MEDIUM);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Waypoint;