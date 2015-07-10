/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flights make parts
var makeFlight = require("./flights.flight");
var makeAirfieldTaxi = require("./airfields.taxi");

// Generate mission flights
module.exports = function makeFlights() {
	
	var rand = this.rand;
	var player = this.player;
	var unit;

	this.flights = [];

	// Use requested player unit
	if (player.unit) {
		unit = player.unit;
	}
	// Pick a random unit
	else {
		unit = rand.pick(Object.keys(this.unitsByID));
	}
	
	// TODO: Make a number of active and shedulled flights
	var flight = makeFlight.call(this, {
		player: true,
		state: player.state,
		unit: unit,
		mission: {
			type: "training",
			planes: [1],
			payload: "bombs"
		}
	});
	
	if (flight) {
		
		this.flights.push(flight);
		
		// Set player flight reference
		if (flight.player) {
			this.flights.player = flight;
		}
	}
	
	// Enable not used taxi routes for all active airfields
	for (var airfieldID in this.airfieldsByID) {
		
		var airfield = this.airfieldsByID[airfieldID];
		
		// Ignore airfields without value (no active planes/units)
		if (!airfield.value) {
			continue;
		}
		
		// Choose taxi routes randomly
		var taxiRoutes = rand.shuffle(Object.keys(airfield.taxi));
		
		for (var taxiRouteID of taxiRoutes) {
			
			var taxiRunwayID = airfield.taxi[taxiRouteID][1];
			
			// Enable one random taxi route for each runway
			if (!airfield.activeTaxiRoutes || !airfield.activeTaxiRoutes[taxiRunwayID]) {
				makeAirfieldTaxi.call(this, airfield, +taxiRouteID);
			}
		}
	}
};