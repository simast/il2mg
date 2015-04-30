/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Make mission flight pilot
module.exports = function makeFlightPilot(unit) {

	var pilot = Object.create(null);
	var rand = this.rand;
	var ranks = this.data.countries[unit.country].ranks;
	
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
	// TODO: Support female names
	pilot.name = makePilotName.call(this, unit);
	
	// TODO: Make sure pilot id is unique (prepend with first letter of name if required)
	pilot.id = pilot.name[1];
	
	return pilot;
};

// Make a pilot name
function makePilotName(unit) {
	
	var names = this.data.countries[unit.country].names;
	var name = [];
	
	name.full = "";
	name.short = "";
	
	// First name
	if (names.first.total) {
		name.push(makePilotNamePart.call(this, names.first));
	}
	
	// 5% percent chance to use a middle name
	if (names.middle.total && this.rand.bool(0.05)) {
		name.push(makePilotNamePart.call(this, names.middle));
	}
	
	// Last name
	if (names.last.total) {
		name.push(makePilotNamePart.call(this, names.last));
	}
	
	name.full = name.join(" ");
	name.short = name.slice(1).join(" ");
	
	return name;
}

// Make a random weighted pilot name part
function makePilotNamePart(names) {
	
	// Build range/interval index
	if (!names.ranges) {
		
		names.ranges = [];
		
		Object.keys(names).forEach(function(value) {
			
			value = parseInt(value, 10);
			
			if (!isNaN(value)) {
				names.ranges.push(value);
			}
		});
		
		names.ranges.sort(function(a, b) {
			return b - a;
		});
	}
	
	var weightTarget = this.rand.integer(1, names.total);
	var weightCurrent = 0;
	var weight;
	
	for (weight of names.ranges) {
		
		weightCurrent += weight;
		
		if (weightTarget <= weightCurrent) {
			return this.rand.pick(names[weight]);
		}
	}
	
	return this.rand.pick(names[weight]);
}