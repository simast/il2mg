/** @copyright Simas Toleikis, 2016 */
"use strict";

// Cold temperature speed boost effect (+0.24% km/h for each -1°C)
const COLD_BOOST = 0.0024;

// Make flight speed
module.exports = function makeFlightSpeed(flight) {
	
	// TODO: Cache speed data (per flight based on altitude)
	
	let speed = this.planes[flight.leader.plane].speed;
	
	// Apply temperature factor
	speed = speed - (speed * COLD_BOOST * this.weather.temperature.level);
	
	// TODO: Apply altitude factor
	
	return Math.round(speed);
};