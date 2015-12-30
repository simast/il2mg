/** @copyright Simas Toleikis, 2015 */
"use strict";

const people = require("./people");
const Plane = require("../item").Plane;

// Make mission flight pilots
module.exports = function makeFlightPilots(flight) {

	// TODO: Support female pilots/names

	const rand = this.rand;
	const task = this.tasks[flight.task];
	const player = this.player;
	const unit = this.units[flight.unit];
	const ranks = DATA.countries[unit.country].ranks;
	const pilotIDs = Object.create(null);
	
	// Build an index list of weighted pilot ranks by type
	if (!ranks.weighted) {
		
		ranks.weighted = Object.create(null);
		
		for (let rankID in ranks) {
			
			rankID = parseInt(rankID, 10);
			
			if (isNaN(rankID)) {
				continue;
			}
			
			const rank = ranks[rankID];
			
			if (typeof rank.type !== "object") {
				continue;
			}
			
			for (const rankType in rank.type) {
				
				let ranksWeighted = ranks.weighted[rankType];
				
				// Initialize weighted rank array
				if (!ranksWeighted) {
					
					ranksWeighted = ranks.weighted[rankType] = [];
					ranksWeighted.ranges = Object.create(null);
				}
				
				const rankWeight = rank.type[rankType];

				if (rankWeight > 0) {

					// Start and end range for weighted rank interval
					ranksWeighted.ranges[rankID] = [
						ranksWeighted.length,
						ranksWeighted.length
					];

					for (let i = 0; i < rankWeight; i++) {

						ranksWeighted.push(rankID);

						if (i > 0) {
							ranksWeighted.ranges[rankID][1]++;
						}
					}
				}
			}
		}
	}
	
	flight.elements.forEach(element => {
		
		let leaderPlane = null;

		// Create pilot for each plane
		element.forEach(plane => {

			const isFlightLeader = (plane === flight.leader);
			const isElementLeader = (plane === element[0]);
			const ranksWeighted = ranks.weighted.pilot;

			// A set used to track unique pilot names (and prevent duplicates)
			this.pilots = this.pilots || new Set();

			// Lower and upper pilot rank weighted list range bounds
			const rankRange = {
				type: "pilot",
				min: 0,
				max: Math.max(ranksWeighted.length - 1, 0)
			};

			if (isFlightLeader) {

				// NOTE: With a single plane flight - there are no rank bounds. When the
				// flight plane count increases - the rank bounds for the flight leader
				// will increase as well (to a max 85% weight limit at 6 planes).
				const rankOffset = Math.min((flight.planes / 6) - (1 / 6), 0.85);

				rankRange.min = Math.floor(ranksWeighted.length * rankOffset);
			}
			else {

				const flRankRange = ranksWeighted.ranges[flight.leader.pilot.rank.id];
				
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
			
			let pilot;
			
			// Set a custom player pilot and rank
			if (player.pilot && plane === flight.player) {
				pilot = getPilotPlayer(unit, rankRange);
			}
			// Generate a known or unknown pilot
			else {
			
				// Chance to use a known pilot
				let useKnownPilot = 0;
	
				// NOTE: A multi plane formation flight will have no upper rank limit
				// for known pilots acting as flight leaders (unless strictly required
				// by task configuration).
				let useKnownPilotMaxRankRange = true;
				
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

				const pilots = pilotIDs[pilot.id];
				const baseID = pilot.id;
				let prependLength = 1;
				const uniqueIDList = new Set();
				const uniqueIDIndex = Object.create(null);

				// Prepend duplicated pilot IDs with a part of first name
				do {

					pilots.filter(pilot => {
						return uniqueIDIndex[pilot.id] !== 1;
					}).forEach(pilot => {

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

		});
		
		// Make sure the selected leading pilot is actually a leader of the element
		if (element.length > 1 && leaderPlane !== element[0]) {
			
			const notLeaderPlane = element[0];
			const leaderPlaneIndex = element.indexOf(leaderPlane);
			
			// Switch planes
			element[0] = leaderPlane;
			element[leaderPlaneIndex] = notLeaderPlane;
		}
		
	});

	// Get a known (real) pilot from the unit data
	function getPilotKnown(unit, rankRange, useMaxRankRange) {

		if (!unit.pilots || !unit.pilots.length) {
			return;
		}
		
		const ranksWeighted = DATA.countries[unit.country].ranks.weighted.pilot;
		let pilotFound;
		let pilotIndex;
		let pilotRank;
		
		for (pilotIndex = 0; pilotIndex < unit.pilots.length; pilotIndex++) {
			
			const pilotData = unit.pilots[pilotIndex];
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
		
		const pilot = Object.create(null);

		// Set a known pilot rank
		pilot.rank = people.getRank(pilotRank, unit.country);

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

		const names = DATA.countries[unit.country].names;
		const pilot = Object.create(null);
		let name;

		do {

			pilot.name = "";
			pilot.id = "";
			
			name = people.getName(names);

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
		pilot.rank = people.getRank(rankRange, unit.country);
		
		return pilot;
	}
	
	// Get a custom player pilot
	function getPilotPlayer(unit, rankRange) {
		
		let pilot = Object.create(null);
		const ranks = DATA.countries[unit.country].ranks;
		const playerName = player.pilot.name;
		const playerRank = player.pilot.rank;
		
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
			pilot.rank = people.getRank(playerRank, unit.country);
		}
		// Use a random weighted rank from valid range
		else {
			pilot.rank = people.getRank(rankRange, unit.country);
		}
		
		return pilot;
	}
};