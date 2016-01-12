/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission player choice data
module.exports = function makePlayer() {

	const rand = this.rand;
	const params = this.params;
	const player = this.player = Object.create(null);

	// Initial valid units list (all units)
	let unitsList = Object.keys(this.units);

	// Validate desired coalition param
	if (params.coalition) {

		// Inactive coalition
		if (!this.unitsByCoalition[params.coalition]) {
			throw ["Coalition is not active!", {coalition: params.coalition}];
		}

		player.coalition = params.coalition;

		// Filter units based on coalition
		unitsList = Object.keys(this.unitsByCoalition[player.coalition]);
	}

	// Validate desired country param
	if (params.country) {

		// Make sure country is part of requested coalition
		if (player.coalition && DATA.countries[params.country].coalition !== player.coalition) {

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

		// Filter units based on country
		unitsList = unitsList.filter((unitID) => {
			return (unitID in this.unitsByCountry[player.country]);
		});
	}

	// Validate desired airfield param
	if (params.airfield) {

		const airfieldID = params.airfield.toLowerCase();

		// Unknown airfield ID/name
		if (!this.airfields[airfieldID]) {
			throw ["Unknown airfield name!", {airfield: params.airfield}];
		}
		// Inactive airfield
		else if (!this.unitsByAirfield[airfieldID]) {
			throw ["Airfield is not active!", {airfield: params.airfield}];
		}

		player.airfield = airfieldID;

		// Filter units by player chosen airfield
		unitsList = unitsList.filter((unitID) => {
			return (unitID in this.unitsByAirfield[player.airfield]);
		});
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
	player.state = DATA.flightState.START;

	if (params.state !== undefined) {
		player.state = params.state;
	}

	// Limit to units stationed on airfields with available taxi route data (unless
	// the player explicitly requests an air start or specifies an airfield).
	if (typeof player.state !== "number" && player.airfield === undefined) {

		unitsList = unitsList.filter((unitID) => {

			const unit = this.units[unitID];

			// Filter out unit groups
			if (Array.isArray(unit)) {
				return false;
			}

			return !!this.airfields[unit.airfield].taxi;
		});
	}

	// TODO: Retry mission generation when unit list is empty
	if (!unitsList.length) {
		throw "No valid units found!";
	}

	// Set valid player units list
	player.units = unitsList;
};