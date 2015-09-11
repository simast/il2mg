/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Make mission flight pilots
module.exports = function makeFlightPilots(flight) {

	// TODO: Support female pilots/names

	var rand = this.rand;
	var task = this.tasks[flight.task];
	var player = this.player;
	var unit = this.units[flight.unit];
	var ranks = DATA.countries[unit.country].ranks;
	var pilotIDs = Object.create(null);
	
	// Build an index list of weighted pilot ranks by type
	if (!ranks.weighted) {
		
		ranks.weighted = Object.create(null);
		
		for (var rankID in ranks) {
			
			rankID = parseInt(rankID, 10);
			
			if (isNaN(rankID)) {
				continue;
			}
			
			var rank = ranks[rankID];
			
			if (typeof rank.type !== "object") {
				continue;
			}
			
			for (var rankType in rank.type) {
				
				var ranksWeighted = ranks.weighted[rankType];
				
				// Initialize weighted rank array
				if (!ranksWeighted) {
					
					ranksWeighted = ranks.weighted[rankType] = [];
					ranksWeighted.ranges = Object.create(null);
				}
				
				var rankWeight = rank.type[rankType];

				if (rankWeight > 0) {

					// Start and end range for weighted rank interval
					ranksWeighted.ranges[rankID] = [
						ranksWeighted.length,
						ranksWeighted.length
					];

					for (var i = 0; i < rankWeight; i++) {

						ranksWeighted.push(rankID);

						if (i > 0) {
							ranksWeighted.ranges[rankID][1]++;
						}
					}
				}
			}
		}
	}
	
	flight.elements.forEach(function(element) {
		
		var leaderPlane = null;

		// Create pilot for each plane
		element.forEach(function(plane) {

			var isFlightLeader = (plane === flight.leader);
			var isElementLeader = (plane === element[0]);
			var ranksWeighted = ranks.weighted.pilot;

			// A set used to track unique pilot names (and prevent duplicates)
			this.pilots = this.pilots || new Set();

			// Lower and upper pilot rank weighted list range bounds
			var rankRange = {
				type: "pilot",
				min: 0,
				max: Math.max(ranksWeighted.length - 1, 0)
			};

			if (isFlightLeader) {

				// NOTE: With a single plane flight - there are no rank bounds. When the
				// flight plane count increases - the rank bounds for the flight leader
				// will increase as well (to a max 85% weight limit at 6 planes).
				var rankOffset = Math.min((flight.planes / 6) - (1 / 6), 0.85);

				rankRange.min = Math.floor(ranksWeighted.length * rankOffset);
			}
			else {

				var flRankRange = ranksWeighted.ranges[flight.leader.pilot.rank.id];
				
				if (flRankRange) {
					
					// Make sure that high ranking (60-85% and above) flight leaders in the same
					// flight don't have higher (or the same) subordinate pilots.
					if ((flRankRange[0] + flRankRange[1]) / 2 / rankRange.max > rand.real(0.6, 0.85)) {
						rankRange.max = Math.max(flRankRange[0] - 1, 0);
					}
					// Lower rank flight leaders can be mixed with the same (and below) ranks
					else {
						rankRange.max = flRankRange[1];
					}
				}
			}
			
			// Modify max rank range based on task rankMax configuration parameter
			if (typeof task.rankMax === "number") {
				rankRange.max = Math.min(Math.floor(ranksWeighted.length * task.rankMax), rankRange.max);
			}
			
			// Modify min rank range based on task rankMin configuration parameter
			if (typeof task.rankMin === "number") {
				rankRange.min = Math.max(Math.floor(ranksWeighted.length * task.rankMin), rankRange.min);
			}
			
			var pilot;
			
			// Set a custom player pilot and rank
			if (player.pilot && plane === flight.player) {
				pilot = getPilotPlayer(unit, rankRange);
			}
			// Generate a known or unknown pilot
			else {
			
				// Chance to use a known pilot
				var useKnownPilot = 0;
	
				// NOTE: A multi plane formation flight will have no upper rank limit
				// for known pilots acting as flight leaders (unless strictly required
				// by task configuration).
				var useKnownPilotMaxRankRange = true;
				
				if (unit.pilots && unit.pilots.length) {
	
					// NOTE: The chance to use a known pilot is based on number of known
					// pilots and max unit pilot count ratio.
					useKnownPilot = Math.min(unit.pilots.length / unit.pilots.max, 1);
	
					// At least 50% chance to search known pilots for flight leaders with
					// a multi-plane flight formation.
					if (isFlightLeader && flight.planes > 1) {
						
						useKnownPilot = Math.max(useKnownPilot, 0.5);
						
						if (typeof task.rankMax !== "number") {
							useKnownPilotMaxRankRange = false;
						}
					}
					// At least 25% chance to search known pilots for element leaders
					else if (isElementLeader) {
						useKnownPilot = Math.max(useKnownPilot, 0.25);
					}
				}
	
				do {
	
					pilot = null;
	
					// Try selecting a known pilot
					if (useKnownPilot && rand.bool(useKnownPilot)) {
						pilot = getPilotKnown(unit, rankRange, useKnownPilotMaxRankRange);
					}
	
					// Generate an unknown pilot
					if (!pilot) {
						pilot = getPilotUnknown(unit, rankRange);
					}
				}
				while (this.pilots.has(pilot.name.toLowerCase()));
			}

			this.pilots.add(pilot.name.toLowerCase());

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
			
			// Mark the top ranking pilot as a leader of this element
			if (!leaderPlane || leaderPlane.pilot.rank.id < pilot.rank.id) {
				leaderPlane = plane;
			}

		}, this);
		
		// Make sure the selected leading pilot is actually a leader of the element
		if (element.length > 1 && leaderPlane !== element[0]) {
			
			var notLeaderPlane = element[0];
			var leaderPlaneIndex = element.indexOf(leaderPlane);
			
			// Switch planes
			element[0] = leaderPlane;
			element[leaderPlaneIndex] = notLeaderPlane;
		}
		
	}, this);

	// Get a known (real) pilot from the unit data
	function getPilotKnown(unit, rankRange, useMaxRankRange) {

		if (!unit.pilots || !unit.pilots.length) {
			return;
		}
		
		var ranksWeighted = DATA.countries[unit.country].ranks.weighted.pilot;
		var pilotFound;
		var pilotIndex;
		var pilotRank;
		
		for (pilotIndex = 0; pilotIndex < unit.pilots.length; pilotIndex++) {
			
			var pilotData = unit.pilots[pilotIndex];
			pilotRank = Math.abs(pilotData.rank);
			
			// Use first matching known pilot by rank requirements
			if (pilotRank >= ranksWeighted[rankRange.min] &&
					(!useMaxRankRange || pilotRank <= ranksWeighted[rankRange.max])) {
				
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
		pilot.rank = getRank(pilotRank, unit.country);

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

		var names = DATA.countries[unit.country].names;
		var pilot = Object.create(null);
		var name;

		do {

			pilot.name = "";
			pilot.id = "";
			
			name = getName(names);

			// First name and last name parts are required and should not be the same
			if (name.first && name.last && name.first[0] !== name.last[name.last.length - 1]) {
				
				// Set full pilot name
				pilot.name = name.first.join(" ") + " " + name.last.join(" ");
			}
		}
		// NOTE: Enforce max 22 characters for full pilot name
		while (!pilot.name.length || pilot.name.length >= 22);

		// Pilot ID (unique short name)
		if (name.last) {
			pilot.id = name.last.join(" ");
		}
		
		// Set an unknown pilot rank
		pilot.rank = getRank(rankRange, unit.country);
		
		return pilot;
	}
	
	// Get a custom player pilot
	function getPilotPlayer(unit, rankRange) {
		
		var pilot = Object.create(null);
		var ranks = DATA.countries[unit.country].ranks;
		var playerName = player.pilot.name;
		var playerRank = player.pilot.rank;
		
		// Only rank set by the player
		if (!playerName || !playerName.length || !playerName[0].length) {
			pilot = getPilotUnknown(unit, rankRange);
		}
		// Set custom player name and id
		else {
		
			pilot.name = playerName.join(" ").replace(/\s+/g, " ");
			pilot.id = playerName[playerName.length - 1];
			
			// Use last word from name as pilot id
			if (playerName.length === 1) {
				pilot.id = playerName[0].split(/\s+/).slice(-1)[0];
			}
			
			pilot.id = pilot.id.replace(/\s+/g, " ");
		}
		
		// Use a custom requested rank
		if (playerRank && ranks[playerRank]) {
			pilot.rank = getRank(playerRank, unit.country);
		}
		// Use a random weighted rank from valid range
		else {
			pilot.rank = getRank(rankRange, unit.country);
		}
		
		return pilot;
	}

	// Get a random weighted name
	function getName(names) {
	
		var nameParts = Object.create(null);

		// Make all name parts
		for (var namePart in names) {
			
			var parts = [];
	
			// Make each sub-part of name part
			names[namePart].forEach(function(nameList) {
	
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
			
			nameParts[namePart] = parts;
		}
		
		return nameParts;
	}

	// Get a rank
	function getRank(rankID, countryID) {
		
		var ranks = DATA.countries[countryID].ranks;
		
		// Generate a random weighted rank based on type and/or range bounds
		if (typeof rankID === "object") {
			
			var ranksWeighted = ranks.weighted[rankID.type];
			
			// Random weighted rank for a given type
			if (rankID.min === undefined || rankID.max === undefined) {
				rankID = rand.pick(ranksWeighted);
			}
			// Use weighted rank range bounds
			else {
				rankID = ranksWeighted[rand.integer(rankID.min, rankID.max)];
			}
		}

		var rankData = ranks[rankID];
		var rank = Object.create(null);

		// Rank ID
		rank.id = rankID;
	
		// Full rank name
		rank.name = rankData.name;
	
		// Short rank abbreviation
		if (rankData.abbr) {
			rank.abbr = rankData.abbr;
		}

		return rank;
	}
	
	// Export functions used for making random names and ranks
	makeFlightPilots.getName = getName;
	makeFlightPilots.getRank = getRank;
};