/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flights make parts
var makeFlight = require("./flights.flight");

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
		unit: unit,
		mission: {
			planes: 4
		}
	});
	
	if (flight) {
		
		this.flights.push(flight);
		
		// Set player flight reference
		if (flight.player) {
			this.flights.player = flight;
		}
	}
};