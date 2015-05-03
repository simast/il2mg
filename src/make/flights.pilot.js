/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Make mission flight pilot
module.exports = function makeFlightPilot(unit, isLeader) {

	// TODO: Support female pilots/names

	var rand = this.rand;
	var ranks = this.data.countries[unit.country].ranks;
	var names = this.data.countries[unit.country].names;

	// A set used to track unique pilot names (and prevent duplicates)
	this.pilots = this.pilots || new Set();

	// Chance to use a known pilot
	var useKnownPilot = 0;

	if (unit.pilots) {
		useKnownPilot = Math.min(unit.pilots.length / unit.pilots.max, 1);
	}
	
	var pilot;
	do {

		pilot = null;

		// Try selecting a known pilot
		if (useKnownPilot && rand.bool(useKnownPilot)) {
			pilot = getPilotKnown();
		}

		// Generate an unknown pilot
		if (!pilot) {
			pilot = getPilotUnknown();
		}
	}
	while (this.pilots.has(pilot.name));

	this.pilots.add(pilot.name);
	
	// Set pilot level
	if (pilot.level === undefined) {

		// TODO: Set pilot AI level based on difficulty command-line param
		// TODO: Set pilot AI level based on leader/rank
		// TODO: Use a separate enum for pilot level (not plane AI level constants)
		pilot.level = rand.pick([
			Plane.AI_LOW,
			Plane.AI_NORMAL,
			Plane.AI_HIGH,
			Plane.AI_ACE
		]);
	}

	return pilot;

	// Get a known (real) pilot from the unit data
	function getPilotKnown() {

		if (!unit.pilots || !unit.pilots.length) {
			return;
		}

		var pilot = Object.create(null);

		// TODO: Pick known pilot based on leader or non-leader role requirements
		var pilotIndex = rand.integer(0, unit.pilots.length - 1);
		var pilotData = unit.pilots[pilotIndex];

		// Remove pilot from unit data (mark as used)
		unit.pilots.splice(pilotIndex, 1);

		pilot.rank = getPilotRank(Math.abs(pilotData.rank));

		// Pilot name as array of name components
		if (Array.isArray(pilotData.name)) {

			pilot.name = pilotData.name.join(" ");
			pilot.id = pilotData.name.slice(-1)[0];
		}
		// Pilot name as full name string
		else {

			pilot.name = pilotData.name;
			pilot.id = pilotData.name.split(" ").slice(-1)[0];
		}
		
		// Force ace pilot level
		if (pilotData.rank < 0) {
			pilot.level = Plane.AI_ACE;
		}

		return pilot;
	}

	// Get an unknown (fake) pilot
	function getPilotUnknown() {

		var pilot = Object.create(null);
		var nameParts;

		do {

			pilot.name = "";
			pilot.id = "";
			nameParts = Object.create(null);

			// Make all name parts
			for (var namePart in names) {
				nameParts[namePart] = getPilotNamePart(names[namePart]);
			}

			// Set full pilot name
			if (nameParts.first && nameParts.last) {
				pilot.name = nameParts.first.join(" ") + " " + nameParts.last.join(" ");
			}
		}
		// Enforce max 22 characters for full pilot name
		while (pilot.name.length >= 22);

		// Pilot ID (unique short name)
		// TODO: Make sure pilot id is unique per flight (prepend with first letter of name if required)
		if (nameParts.last) {
			pilot.id = nameParts.last.join(" ");
		}
		
		// Set a weighted pseudo-random pilot rank
		pilot.rank = getPilotRank();
		
		return pilot;
	}

	// Get a random weighted pilot name part
	function getPilotNamePart(names) {
	
		var parts = [];

		// Make each sub-part of requested name part
		names.forEach(function(nameList) {

			// Build range/interval name list index
			if (!nameList.ranges) {

				nameList.ranges = [];

				Object.keys(nameList).forEach(function(value) {

					value = parseInt(value, 10);

					if (!isNaN(value)) {
						nameList.ranges.push(value);
					}
				});

				nameList.ranges.sort(function(a, b) {
					return b - a;
				});
			}

			var name;
			var weightTarget = rand.integer(1, nameList.total);
			var weightCurrent = 0;
			var weight;

			for (weight of nameList.ranges) {

				weightCurrent += weight;

				if (weightTarget <= weightCurrent) {

					// Name part matches weight
					name = rand.pick(nameList[weight]);
					break;
				}
			}

			// Use one of the least popular name parts
			if (!name) {
				name = rand.pick(nameList[weight]);
			}
	
			if (name.length) {
				parts.push(name);
			}
		});
	
		return parts;
	}

	// Get pilot rank
	function getPilotRank(rankID) {

		// Generate a random weighted rank
		if (!rankID || !ranks[rankID]) {

			// Build a weighted list of leading and normal (non-leading) pilot ranks
			if (!ranks.weighted) {

				var rankIDs = Object.keys(ranks);

				ranks.weighted = {
					leader: [],
					normal: []
				};

				rankIDs.forEach(function(rankID) {

					var rankWeight = ranks[rankID][0];

					for (var i = 0; i < Math.abs(rankWeight); i++) {

						// Normal rank
						if (rankWeight > 0) {
							ranks.weighted.normal.push(rankID);
						}
						// Leader rank
						else {
							ranks.weighted.leader.push(rankID);
						}
					}
				});
			}
			
			rankID = rand.pick(ranks.weighted[isLeader ? "leader" : "normal"]);
		}
		
		if (!rankID) {
			return;
		}

		var rankData = ranks[rankID];
		var rank = Object.create(null);
	
		// Full rank name
		rank.name = rankData[1];
	
		// Short rank acronym
		if (rankData[2]) {
			rank.acronym = rankData[2];
		}

		return rank;
	}
};