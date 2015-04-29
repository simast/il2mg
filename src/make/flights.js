/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flights make parts
var makeFlight = require("./flights.flight");

// Generate mission flights
module.exports = function makeFlights() {
	
	this.flights = [];
	
	// Pick a random unit
	var unit = this.rand.pick(Object.keys(this.unitsByID));
	
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