/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
const makeFlightSpeed = require("./flight.speed");

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Split long routes into multiple waypoints
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
	const rand = this.rand;
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
	
	// Use some +-200 meters randomness for each spot point altitude
	spot.point[1] = spot.point[1] + rand.integer(-200, 200);
	
	const speed = makeFlightSpeed.call(this, flight, to[1]);
	
	// Use some ~2% randomness for each spot speed
	spot.speed = Math.round(speed * rand.real(0.99, 1.01));
	
	return [spot];
};