/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU = require("./MCU");

// ComplexTrigger item
function MCU_TR_ComplexTrigger() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
}

MCU_TR_ComplexTrigger.prototype = Object.create(MCU.prototype, {
	
	// Valid ComplexTrigger event type name and ID constants
	EVENTS: {
		value: {
			OnObjectSpawned: 57,
			OnObjectEntered: 58,
			OnObjectEnteredAlive: 59,
			OnObjectLeft: 60,
			OnObjectLeftAlive: 61,
			OnObjectFinished: 62,
			OnObjectFinishedAlive: 63,
			OnObjectStationaryAndAlive: 64,
			OnObjectFinishedStationaryAndAlive: 65,
			OnObjectTookOff: 66,
			OnObjectDamaged: 67,
			OnObjectCriticallyDamaged: 68,
			OnObjectRepaired: 69,
			OnObjectKilled: 70,
			OnObjectDroppedBombs: 71,
			OnObjectFiredRockets: 72,
			OnObjectFiredFlare: 73
		}
	}
});

MCU_TR_ComplexTrigger.prototype.typeID = 40;

// ComplexTrigger event filters (with order representing bit number in binary file)
var eventFilters = [
	"EventsFilterSpawned",
	"EventsFilterEnteredSimple",
	"EventsFilterEnteredAlive",
	"EventsFilterLeftSimple",
	"EventsFilterLeftAlive",
	"EventsFilterFinishedSimple",
	"EventsFilterFinishedAlive",
	"EventsFilterStationaryAndAlive",
	"EventsFilterFinishedStationaryAndAlive",
	"EventsFilterTookOff",
	"EventsFilterDamaged",
	"EventsFilterCriticallyDamaged",
	"EventsFilterRepaired",
	"EventsFilterKilled",
	"EventsFilterDropedBombs",
	"EventsFilterFiredFlare",
	"EventsFilterFiredRockets"
];

// Events are available for ComplexTrigger item
MCU_TR_ComplexTrigger.prototype.addEvent = MCU.addEvent;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_ComplexTrigger.prototype.toBinary = function(index) {

	var size = 0;
	var buffer = new Buffer(size);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_ComplexTrigger;