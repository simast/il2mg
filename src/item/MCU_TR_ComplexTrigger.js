/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");
const MCU = require("./MCU");

// Complex Trigger event filters (with order representing bit number in binary file)
const eventFilters = [
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

// Complex Trigger item
module.exports = class MCU_TR_ComplexTrigger extends MCU {

	constructor() {
		super();

		this.Enabled = 1;
		this.Cylinder = 1;
		this.Radius = 1000;
		this.DamageThreshold = 1;
		this.DamageReport = Item.DEFAULT_DAMAGE_REPORT;
		this.CheckEntities = 0;
		this.CheckVehicles = 0;

		eventFilters.forEach((eventFilter) => {
			this[eventFilter] = 0;
		});
	}
	
	// Valid Complex Trigger event type name and ID constants
	get EVENTS() {
		return {
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
		};
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		
		yield* super.toBinary(index, 40);

		let size = 36;
		
		if (this.events) {
			size += this.events.items.length * 8;
		}
		
		const countries = [];
		const scripts = [];
		const names = [];

		// Build countries list
		if (this.Country instanceof Set) {

			for (const countryID of this.Country) {

				countries.push(countryID);
				size += 4;
			}
		}

		// Build scripts list
		if (this.ObjectScript instanceof Set) {

			for (const script of this.ObjectScript) {

				scripts.push(script);
				size += 4 + Buffer.byteLength(script);
			}
		}
		
		// Build names list
		if (this.ObjectName instanceof Set) {

			for (const name of this.ObjectName) {

				names.push(name);
				size += 4 + Buffer.byteLength(name);
			}
		}

		const buffer = new Buffer(size);

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
		let eventsFilterValue = 0;

		eventFilters.forEach((eventFilterProp, eventFilterIndex) => {

			// NOTE: In binary file event filter properties are stored as individual
			// bits (flags) in a 32-bit unsigned integer value.
			if (this[eventFilterProp]) {
				eventsFilterValue |= 1 << eventFilterIndex;
			}
		});

		this.writeUInt32(buffer, eventsFilterValue);
		
		// Country filter list
		this.writeUInt32Array(buffer, countries);

		// ObjectScript filter list size
		this.writeUInt32(buffer, scripts.length);

		// ObjectScript filter list items
		scripts.forEach((script) => {
			this.writeString(buffer, Buffer.byteLength(script), script);
		});
		
		// ObjectName filter list size
		this.writeUInt32(buffer, names.length);

		// ObjectName filter list items
		names.forEach((name) => {
			this.writeString(buffer, Buffer.byteLength(name), name);
		});
		
		yield buffer;
	}
};