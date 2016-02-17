/** @copyright Simas Toleikis, 2015 */
"use strict";

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
	
	// Compute waypoint speed based on current temperature
	const speedP25 = leaderPlaneData.speed[0];
	const speedM25 = leaderPlaneData.speed[1];
	const temperature = this.weather.temperature.level;
	
	// NOTE: Speed data is for +25°C to -25°C interval
	const tempFactor = 1 - (temperature + 25) / 50;
	const speed = speedP25 + (speedM25 - speedP25) * tempFactor;
	
	// Use +-1% random speed variation
	spot.speed = Math.round(speed * rand.real(0.99, 1.01, true));
	
	return [spot];
};