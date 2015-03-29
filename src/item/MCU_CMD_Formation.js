/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Formation command item
function MCU_CMD_Formation() {

}

MCU_CMD_Formation.prototype = Object.create(MCU.prototype);
MCU_CMD_Formation.prototype.typeID = 19;

// Formation command type constants
var type = MCU_CMD_Formation.type = {
	PLANE_NONE: 0, // Plane: None
	PLANE_V: 1, // Plane: V-Form
	PLANE_EDGE_LEFT: 2, // Plane: Left Edge Form
	PLANE_EDGE_RIGHT: 3, // Plane: Right Edge Form
	VEHICLE_COLUMN_ROAD: 4, // Vehicle: On Road Column
	VEHICLE_COLUMN: 5, // Vehicle: Off Road Column
	VEHICLE_COLUMN_CUSTOM: 6, // Vehicle: Off Road User Formation
	VEHICLE_FORWARD: 7, // Vehicle: Forward
	VEHICLE_BACKWARD: 8, // Vehicle: Backward
	VEHICLE_STOP: 9, // Vehicle: Stop
	VEHICLE_STOP_PANIC: 10, // Vehicle: Panic Stop
	VEHICLE_STOP_DIRECTION: 12, // Vehicle: Set Direction and Stop
	VEHICLE_CONTINUE: 11 // Vehicle: Continue Moving
};

// Formation command density constants
var density = MCU_CMD_Formation.density = {
	DENSE: 0,
	SAFE: 1,
	LOOSE: 2
};

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_Formation.prototype.toBinary = function(index) {

	var buffer = new Buffer(8);

	// FormationType
	this.writeUInt32(buffer, this.FormationType !== undefined ? this.FormationType : type.PLANE_NONE);

	// FormationDensity
	this.writeUInt32(buffer, this.FormationDensity !== undefined ? this.FormationDensity : density.SAFE);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_CMD_Formation;