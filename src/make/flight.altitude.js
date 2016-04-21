/** @copyright Simas Toleikis, 2016 */
"use strict";

// Min/max altitude (in meters)
const MIN_ALTITUDE = 1500;
const MAX_ALTITUDE = 3500;

// Make flight altitude
module.exports = function makeFlightAltitude() {
	
	const rand = this.rand;
	const clouds = this.weather.clouds;
	
	// TODO: Use plane altitude preference
	
	let minAltitude = MIN_ALTITUDE;
	
	if (clouds.cover > 0) {
		
		minAltitude = clouds.altitude + clouds.thickness + 500;
		minAltitude = Math.max(minAltitude, MIN_ALTITUDE);
		minAltitude = Math.min(minAltitude, MAX_ALTITUDE - 500);
	}
	
	return rand.integer(minAltitude, MAX_ALTITUDE);
};