/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Make mission flight pilot
module.exports = function makeFlightPilot(unit) {

	var pilot = Object.create(null);
	var rand = this.rand;
	var ranks = this.data.countries[unit.country].ranks;
	var names = this.data.countries[unit.country].names;
	
	// TODO: Use known pilots from unit
	
	// TODO: Generate pseudo-random pilot rank
	pilot.rank = ranks[ranks.default];
	
	// TODO: Set pilot AI level based on difficulty command-line param
	pilot.level = rand.pick([
		Plane.AI_LOW,
		Plane.AI_NORMAL,
		Plane.AI_HIGH,
		Plane.AI_ACE
	]);
	
	// TODO: Improve pilot name selection
	// TODO: Support name and female names
	pilot.name = [
		rand.pick(names.first),
		rand.pick(names.last)
	];
	
	// TODO: Make sure pilot id is unique (prepend with first letter of name if required)
	pilot.id = pilot.name[1];
	
	return pilot;
};