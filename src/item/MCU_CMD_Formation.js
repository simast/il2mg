/** @copyright Simas Toleikis, 2015 */
"use strict";

const MCU = require("./MCU");

// Formation command item
class MCU_CMD_Formation extends MCU {

	constructor() {
		super();

		this.FormationType = MCU_CMD_Formation.TYPE_PLANE_NONE;
		this.FormationDensity = MCU_CMD_Formation.DENSITY_SAFE;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 19);

		const buffer = new Buffer(8);

		// FormationType
		this.writeUInt32(buffer, this.FormationType);

		// FormationDensity
		this.writeUInt32(buffer, this.FormationDensity);

		yield buffer;
	}
}

// Formation command type constants
MCU_CMD_Formation.TYPE_PLANE_NONE = 0; // Plane: None
MCU_CMD_Formation.TYPE_PLANE_V = 1; // Plane: V-Form
MCU_CMD_Formation.TYPE_PLANE_EDGE_LEFT = 2; // Plane: Left Edge Form
MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT = 3; // Plane: Right Edge Form
MCU_CMD_Formation.TYPE_VEHICLE_COLUMN_ROAD = 4; // Vehicle: On Road Column
MCU_CMD_Formation.TYPE_VEHICLE_COLUMN = 5; // Vehicle: Off Road Column
MCU_CMD_Formation.TYPE_VEHICLE_COLUMN_CUSTOM = 6; // Vehicle: Off Road User Formation
MCU_CMD_Formation.TYPE_VEHICLE_FORWARD = 7; // Vehicle: Forward
MCU_CMD_Formation.TYPE_VEHICLE_BACKWARD = 8; // Vehicle: Backward
MCU_CMD_Formation.TYPE_VEHICLE_STOP = 9; // Vehicle: Stop
MCU_CMD_Formation.TYPE_VEHICLE_STOP_PANIC = 10; // Vehicle: Panic Stop
MCU_CMD_Formation.TYPE_VEHICLE_STOP_DIRECTION = 12; // Vehicle: Set Direction and Stop
MCU_CMD_Formation.TYPE_VEHICLE_CONTINUE = 11; // Vehicle: Continue Moving

// Formation command density constants
MCU_CMD_Formation.DENSITY_DENSE = 0;
MCU_CMD_Formation.DENSITY_SAFE = 1;
MCU_CMD_Formation.DENSITY_LOOSE = 2;

module.exports = MCU_CMD_Formation;