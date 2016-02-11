/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Split long routes into multiple waypoints
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
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
	spot.speed = leaderPlaneData.speed;
	
	return [spot];
};