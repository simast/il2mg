/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission player choice data
module.exports = function makePlayer() {

	var mission = this;
	var rand = this.rand;
	var params = this.params;
	var player = this.player = Object.create(null);

	// Initial valid units list (all units)
	var unitsList = Object.keys(this.unitsByID);

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
		if (player.coalition && this.data.countries[params.country].coalition !== player.coalition) {
			
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
		unitsList = unitsList.filter(function(unitID) {
			return (mission.unitsByCountry[player.country][unitID] !== undefined);
		});
	}

	// Validate desired airfield param
	if (params.airfield) {

		var airfieldID = params.airfield.toLowerCase();

		// Unknown airfield ID/name
		if (!this.airfieldsByID[airfieldID]) {
			throw ["Unknown airfield name!", {airfield: params.airfield}];
		}
		// Inactive airfield
		else if (!this.unitsByAirfield[airfieldID]) {
			throw ["Airfield is not active!", {airfield: params.airfield}];
		}

		player.airfield = airfieldID;
		
		// Filter units by player chosen airfield
		unitsList = unitsList.filter(function(unitID) {
			return (mission.unitsByAirfield[player.airfield][unitID] !== undefined);
		});
	}

	// TODO: Retry mission generation when unit list is empty
	if (!unitsList.length) {
		throw "No valid units found!";
	}

	// Pick a random player unit from valid units list
	player.unit = rand.pick(unitsList);
};