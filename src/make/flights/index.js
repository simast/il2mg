/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flights make parts
var makeFlight = require("./flight");

// Generate mission flights
module.exports = function makeFlights() {
	
	// TODO: Make a number of active and shedulled flights
	makeFlight.call(this, {
		player: true
	});
};