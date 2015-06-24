/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Entity item
function MCU_TR_Entity() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_TR_Entity.prototype = Object.create(MCU.prototype, {
	
	// Valid Entity event type name and ID constants
	EVENTS: {
		value: {
			OnPilotKilled: 0,
			OnPilotWounded: 1,
			OnPlaneCrashed: 2,
			OnPlaneCriticalDamage: 3,
			OnPlaneDestroyed: 4,
			OnPlaneLanded: 5,
			OnPlaneTookOff: 6,
			OnPlaneBingoFuel: 7,
			OnPlaneBingoMainMG: 8,
			OnPlaneBingoBombs: 9,
			OnPlaneBingoTurrets: 10,
			OnPlaneGunnersKilled: 11,
			OnDamaged: 12,
			OnKilled: 13,
			OnMovedTo: 15,
			OnPlaneSpawned: 20,
			OnOutOfPlanes: 21,
			OnPlaneAdded: 22,
			OnFlagBlocked: 23,
			OnFlagUnblocked: 24,
			OnFlagCapturedBy00: 25,
			OnFlagCapturedBy01: 26,
			OnFlagCapturedBy02: 27,
			OnFlagCapturedBy03: 28,
			OnFlagCapturedBy04: 29,
			OnFlagCapturedBy05: 30,
			OnFlagCapturedBy06: 31,
			OnFlagCapturedBy07: 32,
			OnFlagCapturedBy08: 33,
			OnFlagCapturedBy09: 34,
			OnFlagCapturedBy10: 35,
			OnFlagCapturedBy11: 36,
			OnFlagCapturedBy12: 37,
			OnFlagCapturedBy13: 38,
			OnFlagCapturedBy14: 39,
			OnFlagCapturedBy15: 40,
			OnFlagCapturedBy16: 41,
			OnSpottingStarted: 74
		}
	},

	// Valid Entity report type name and ID constants
	REPORTS: {
		value: {
			OnSpawned: 0,
			OnTargetAttacked: 1,
			OnAreaAttacked: 2,
			OnTookOff: 3,
			OnLanded: 4
		}
	}
});

MCU_TR_Entity.prototype.typeID = 30;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_Entity.prototype.toBinary = function(index) {

	var size = 12;

	if (this.events) {
		size += this.events.items.length * 8;
	}

	if (this.reports) {
		size += this.reports.items.length * 12;
	}

	var buffer = new Buffer(size);

	// Events list
	this.writeEvents(buffer);

	// MisObjID
	this.writeUInt32(buffer, this.MisObjID || 0);

	// Reports list
	this.writeReports(buffer);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_Entity;