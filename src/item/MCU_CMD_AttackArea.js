/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Attack area command item
function MCU_CMD_AttackArea() {

	// Call parent constructor
	MCU.apply(this, arguments);
	
	this.AttackGround = 0;
	this.AttackAir = 0;
	this.AttackGTargets = 0;
	this.AttackArea = 1000;
	this.Time = 600; // 10 minutes
	this.Priority = MCU_CMD_AttackArea.PRIORITY_MEDIUM;
}

MCU_CMD_AttackArea.prototype = Object.create(MCU.prototype);
MCU_CMD_AttackArea.prototype.typeID = 20;

// Attack area command priority constants
MCU_CMD_AttackArea.PRIORITY_LOW = 0;
MCU_CMD_AttackArea.PRIORITY_MEDIUM = 1;
MCU_CMD_AttackArea.PRIORITY_HIGH = 2;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_CMD_AttackArea.prototype.toBinary = function* (index) {
	
	yield* MCU.prototype.toBinary.apply(this, arguments);

	var buffer = new Buffer(19);

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
};

module.exports = MCU_CMD_AttackArea;