/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Generate mission player choice data
module.exports = function makePlayer() {
	
	const params = this.params;
	const player = this.player = Object.create(null);
	
	// Validate desired coalition param
	if (params.coalition) {

		// Inactive coalition
		if (!this.unitsByCoalition[params.coalition]) {
			throw ["Coalition is not active!", {coalition: params.coalition}];
		}

		player.coalition = params.coalition;
	}
	
	// Validate desired country param
	if (params.country) {

		// Make sure country is part of requested coalition
		if (player.coalition &&
			data.countries[params.country].coalition !== player.coalition) {

			throw ["Country is not part of coalition!", {
				country: params.country,
				coalition: params.coalition
			}];
		}

		// Inactive country
		if (!this.unitsByCountry[params.country]) {
			throw ["Country is not active!", {country: params.country}];
		}

		player.country = params.country;
	}
	
	// Validate desired task param
	if (params.task) {

		// Unknown task
		if (!this.tasks[params.task]) {
			throw ["Unknown task!", {task: params.task}];
		}

		player.task = params.task;
	}
	
	// Validate desired airfield param
	if (params.airfield) {
		
		// Unknown airfield ID/name
		if (!this.airfields[params.airfield]) {
			throw ["Unknown airfield!", {airfield: params.airfield}];
		}
		// Inactive airfield
		else if (!this.unitsByAirfield[params.airfield]) {
			throw ["Airfield is not active!", {airfield: params.airfield}];
		}

		player.airfield = params.airfield;
	}
	
	// Set desired pilot param data
	if (params.pilot) {

		const pilot = player.pilot = Object.create(null);
		const pilotParts = params.pilot.split(/\s*,\s*/);

		// Pilot name
		pilot.name = pilotParts;

		// Check for optional pilot rank number
		if (/^[0-9]+/.test(pilotParts)) {

			const pilotRank = parseInt(pilotParts[0], 10);

			// Pilot rank and name
			if (!isNaN(pilotRank)) {

				pilot.name = pilotParts.slice(1);
				pilot.rank = pilotRank;
			}
		}
	}
	
	// Set player flight state
	player.state = data.flightState.START;

	if (params.state !== undefined) {
		player.state = params.state;
	}
	
	// Filter out units based on player choices
	const unitsList = Object.keys(this.units).filter((unitID) => {

		const unit = this.units[unitID];
		
		// Filter out unit groups
		if (Array.isArray(unit)) {
			return false;
		}
		
		// Coalition filter
		if (player.coalition && unit.coalition !== player.coalition) {
			return false;
		}
		
		// Country filter
		if (player.country && unit.country !== player.country) {
			return false;
		}
		
		// Task filter
		if (player.task) {
			
			const validTasks = Object.keys(this.battle.roles[unit.country][unit.role]);
			
			if (validTasks.indexOf(player.task) === -1) {
				return false;
			}
		}
		
		// Airfield filter
		if (player.airfield && unit.airfield !== player.airfield) {
			return false;
		}
		
		// Filter units based on selected flight state
		const airfield = this.airfields[unit.airfield];
		
		// Limit to units stationed on airfields with available taxi routes (unless
		// player explicitly requested an air start or specified an airfield)
		if (typeof player.state !== "number" && player.airfield === undefined) {
			
			const taxiData = airfield.taxi;
			
			if (!taxiData || !Object.keys(taxiData).length) {
				return false;
			}
		}
		
		// TODO: Allow starting from offmap airfields!
		return !airfield.offmap;
	});
	
	if (!unitsList.length) {
		throw "No valid units found!";
	}
	
	// Set valid player units list
	player.units = unitsList;
};