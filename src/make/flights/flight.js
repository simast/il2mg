/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");

// Make mission flight
module.exports = function makeFlight(params) {

	// TODO: params.player - player flight flag (or player plane ID)
	// TODO: params.mission - mission ID
	// TODO: params.unit - unit ID
	// TODO: params.country - unit country ID
	// TODO: params.planes - number of planes
	// TODO: params.state - state (parked, runway, in progress, etc)

	var rand = this.rand;
	var units = Object.keys(this.unitsByID);

	// Validate unit ID
	if (params.unit && !this.unitsByID[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}
	// Pick a random unit
	if (!params.unit) {
		params.unit = rand.pick(units);
	}

	// Resolve unit groups
	while (Array.isArray(this.unitsByID[params.unit])) {
		params.unit = rand.pick(this.unitsByID[params.unit]);
	}

	var unit = this.unitsByID[params.unit];
	var plane = this.planesByID[rand.pick(unit.planes)];
	var airfield = this.airfieldsByID[unit.airfield];

	var Plane = Item.Plane;
	var planeObject = this.createItem("Plane");

	planeObject.setName(plane.name);
	planeObject.setPosition(116323.32, 83.238, 102809.66);
	planeObject.setOrientation(0, 47.80, 11);
	planeObject.Script = plane.script;
	planeObject.Model = plane.model;
	planeObject.Country = unit.country;
	planeObject.StartInAir = Plane.START_PARKING;

	if (params.player) {
		planeObject.AILevel = Plane.AI_PLAYER;
	}
	else {
		planeObject.AILevel = Plane.AI_NORMAL;
	}

	// Create plane entity
	planeObject.createEntity();
};