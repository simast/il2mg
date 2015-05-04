/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Make mission flight pilots
module.exports = function makeFlightPilots(flight) {

	// TODO: Support female pilots/names

	var rand = this.rand;
	var data = this.data;
	var pilotIDs = Object.create(null);

	// Create flight pilots
	flight.elements.forEach(function(element) {

		var unit = element.unit;
		var ranks = data.countries[unit.country].ranks;

		// Build a weighted list of pilot ranks
		if (!ranks.weighted) {

			var rankIDs = Object.keys(ranks);

			ranks.weighted = [];
			ranks.weighted.ranges = Object.create(null);

			rankIDs.forEach(function(rankID) {

				var rankWeight = ranks[rankID][0];

				if (rankWeight > 0) {

					// Start and end range for weighted rank interval
					ranks.weighted.ranges[rankID] = [
						ranks.weighted.length,
						ranks.weighted.length
					];

					for (var i = 0; i < rankWeight; i++) {

						ranks.weighted.push(rankID);

						if (i > 0) {
							ranks.weighted.ranges[rankID][1]++;
						}
					}
				}
			});
		}

		element.forEach(function(plane) {

			var isFlightLeader = (plane === flight.leader);
			var isElementLeader = (plane === element[0]);

			// A set used to track unique pilot names (and prevent duplicates)
			this.pilots = this.pilots || new Set();

			// Chance to use a known pilot
			var useKnownPilot = 0;

			if (unit.pilots && unit.pilots.length) {

				// NOTE: The chance to use a known pilot is based on number of known
				// pilots and max unit pilot count ratio.
				useKnownPilot = Math.min(unit.pilots.length / unit.pilots.max, 1);

				// At least 50% chance to search known pilots for flight leaders
				if (isFlightLeader) {
					useKnownPilot = Math.max(useKnownPilot, 0.5);
				}
				// At least 25% chance to search known pilots for element leaders
				else if (isElementLeader) {
					useKnownPilot = Math.max(useKnownPilot, 0.25);
				}
			}

			// Lower and upper pilot rank weighted list range bounds
			var rankRange = {
				min: 0,
				max: ranks.weighted.length - 1
			};

			if (isFlightLeader) {

				// NOTE: With a single plane flight - there are no rank bounds. When the
				// flight plane count increases - the rank bounds for the flight leader
				// will increase as well (to a max 85% weight limit at 6 planes).
				var rankOffset = Math.min((flight.planes / 6) - (1 / 6), 0.85);

				rankRange.min = Math.floor(ranks.weighted.length * rankOffset);
			}
			else {

				var flightLeaderRank = flight.leader.pilot.rank.id;

				// Make sure any other pilots in the same flight don't have higher (or
				// the same) as flight leader rank.
				rankRange.max = Math.max(ranks.weighted.ranges[flightLeaderRank][0] - 1, 0);
			}

			var pilot;
			do {

				pilot = null;

				// Try selecting a known pilot
				if (useKnownPilot && rand.bool(useKnownPilot)) {
					pilot = getPilotKnown(unit, rankRange, isFlightLeader);
				}

				// Generate an unknown pilot
				if (!pilot) {
					pilot = getPilotUnknown(unit, rankRange);
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

			// Track number of pilots with the same ID
			pilotIDs[pilot.id] = pilotIDs[pilot.id] || [];
			pilotIDs[pilot.id].push(pilot);

			// Make sure the pilot ID is unique per flight
			if (pilotIDs[pilot.id].length > 1) {

				var pilots = pilotIDs[pilot.id];
				var baseID = pilot.id;
				var prependLength = 1;
				var uniqueIDList = new Set();
				var uniqueIDIndex = Object.create(null);

				// Prepend duplicated pilot IDs with a part of first name
				do {

					pilots.filter(function(pilot) {
						return uniqueIDIndex[pilot.id] !== 1;
					}).forEach(function(pilot) {

						uniqueIDList.delete(pilot.id);

						pilot.id = pilot.name.substr(0, prependLength) + ". " + baseID;

						if (uniqueIDList.has(pilot.id)) {
							uniqueIDIndex[pilot.id]++;
						}
						else {

							uniqueIDList.add(pilot.id);
							uniqueIDIndex[pilot.id] = 1;
						}
					});

					prependLength++;
				}
				while (uniqueIDList.size !== pilots.length);
			}

			// Set plane pilot
			plane.pilot = pilot;

		}, this);
	}, this);

	// Get a known (real) pilot from the unit data
	function getPilotKnown(unit, rankRange, isFlightLeader) {

		if (!unit.pilots || !unit.pilots.length) {
			return;
		}
		
		var ranks = data.countries[unit.country].ranks;
		var pilotFound;
		var pilotIndex;
		var pilotRank;
		
		for (pilotIndex = 0; pilotIndex < unit.pilots.length; pilotIndex++) {
			
			var pilotData = unit.pilots[pilotIndex];
			pilotRank = Math.abs(pilotData.rank);
			
			// Use first matching known pilot by rank requirements
			// NOTE: Flight leaders have no upper rank requirement for known pilots
			if (pilotRank >= ranks.weighted[rankRange.min] &&
					(isFlightLeader || pilotRank <= ranks.weighted[rankRange.max])) {
				
				pilotFound = pilotData;
				break;
			}
		}
		
		// No matching known pilot
		if (!pilotFound) {
			return;
		}

		// Remove pilot from unit data (mark as used)
		unit.pilots.splice(pilotIndex, 1);
		
		var pilot = Object.create(null);

		// Set a known pilot rank
		pilot.rank = getPilotRank(pilotRank, unit.country);

		// Pilot name as array of name components
		if (Array.isArray(pilotFound.name)) {

			pilot.name = pilotFound.name.join(" ");
			pilot.id = pilotFound.name.slice(-1)[0];
		}
		// Pilot name as full name string
		else {

			pilot.name = pilotFound.name;
			pilot.id = pilotFound.name.split(" ").slice(-1)[0];
		}

		// Force ace pilot level
		if (pilotFound.rank < 0) {
			pilot.level = Plane.AI_ACE;
		}

		return pilot;
	}

	// Get an unknown (fake) pilot
	function getPilotUnknown(unit, rankRange) {

		var names = data.countries[unit.country].names;
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
		
		// Set an unknown pilot rank
		pilot.rank = getPilotRank(rankRange, unit.country);
		
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
	function getPilotRank(rankID, country) {
		
		var ranks = data.countries[country].ranks;
		
		// Generate a random weighted rank from rank range bounds
		if (typeof rankID === "object") {
			rankID = parseInt(ranks.weighted[rand.integer(rankID.min, rankID.max)], 10);
		}

		var rankData = ranks[rankID];
		var rank = Object.create(null);

		// Rank ID
		rank.id = rankID;
	
		// Full rank name
		rank.name = rankData[1];
	
		// Short rank acronym
		if (rankData[2]) {
			rank.acronym = rankData[2];
		}

		return rank;
	}
};