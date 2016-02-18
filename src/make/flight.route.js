/** @copyright Simas Toleikis, 2015 */
"use strict";

// Cold temperature speed boost effect (+0.24% km/h for each -1°C)
const COLD_BOOST = 0.0024;

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Split long routes into multiple waypoints
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
	const rand = this.rand;
	const leaderPlaneData = this.planes[flight.leader.plane];
	const spot = {};
	
	if (options) {
		Object.assign(spot, options);
	}
	
	// Plan an egress route (back to the airfield) when target point is not specified
	if (!to) {
		
		const airfield = this.airfields[flight.airfield];
		
		spot.egress = true;
		
		// FIXME:
		to = [
			airfield.position[0],
			1000,
			airfield.position[2]
		];
	}
	
	spot.point = to;
	
	// Set waypoint speed based on current temperature (and some randomness)
	const baseSpeed = leaderPlaneData.speed;
	const tempFactor = baseSpeed * COLD_BOOST * this.weather.temperature.level;
	
	// TODO: Apply altitude factor
	spot.speed = Math.round((baseSpeed - tempFactor) * rand.real(0.99, 1.01));
	
	return [spot];
};