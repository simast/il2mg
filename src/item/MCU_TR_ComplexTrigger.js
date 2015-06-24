/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var MCU = require("./MCU");

// ComplexTrigger item
function MCU_TR_ComplexTrigger() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
	this.Cylinder = 1;
	this.Radius = 1000;
	this.DamageThreshold = 1;
	this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
	this.CheckEntities = 0;
	this.CheckVehicles = 0;

	eventFilters.forEach(function(eventFilter) {
		this[eventFilter] = 0;
	}, this);
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

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_TR_ComplexTrigger.prototype.toBinary = function(index) {

	var size = 36;
	
	if (this.events) {
		size += this.events.items.length * 8;
	}
	
	var countries = [];
	var scripts = [];
	var names = [];

	// Build countries list
	if (this.Country instanceof Set) {

		for (var countryID of this.Country) {

			countries.push(countryID);
			size += 4;
		}
	}

	// Build scripts list
	if (this.ObjectScript instanceof Set) {

		for (var script of this.ObjectScript) {

			scripts.push(script);
			size += 4 + Buffer.byteLength(script);
		}
	}
	
	// Build names list
	if (this.ObjectName instanceof Set) {

		for (var name of this.ObjectName) {

			names.push(name);
			size += 4 + Buffer.byteLength(name);
		}
	}

	var buffer = new Buffer(size);

	// Events list
	this.writeEvents(buffer);

	// Cylinder
	this.writeUInt8(buffer, this.Cylinder);

	// Radius
	this.writeDouble(buffer, this.Radius);
	
	// DamageReport
	this.writeUInt32(buffer, this.DamageReport);

	// DamageThreshold
	this.writeUInt8(buffer, this.DamageThreshold);

	// CheckEntities
	this.writeUInt8(buffer, this.CheckEntities);
	
	// CheckVehicles
	this.writeUInt8(buffer, this.CheckVehicles);

	// EventsFilter* properties
	var eventsFilterValue = 0;

	eventFilters.forEach(function(eventFilterProp, eventFilterIndex) {

		// NOTE: In binary file event filter properties are stored as individual
		// bits (flags) in a 32-bit unsigned integer value.
		if (this[eventFilterProp]) {
			eventsFilterValue |= 1 << eventFilterIndex;
		}

	}, this);

	this.writeUInt32(buffer, eventsFilterValue);
	
	// Country filter list
	this.writeUInt32Array(buffer, countries);

	// ObjectScript filter list size
	this.writeUInt32(buffer, scripts.length);

	// ObjectScript filter list items
	scripts.forEach(function(script) {
		this.writeString(buffer, Buffer.byteLength(script), script);
	}, this);
	
	// ObjectName filter list size
	this.writeUInt32(buffer, names.length);

	// ObjectName filter list items
	names.forEach(function(name) {
		this.writeString(buffer, Buffer.byteLength(name), name);
	}, this);
	
	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_TR_ComplexTrigger;