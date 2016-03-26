/** @copyright Simas Toleikis, 2015 */
"use strict";

const Vector = require("sylvester").Vector;
const makeFlightSpeed = require("./flight.speed");

// Final egress route constants
const EGRESS_DISTANCE_MIN = 20000; // 20 km
const EGRESS_AIRFIELD_MIN = 7000; // 7 km
const EGRESS_AIRFIELD_MAX = 10000; // 10 km

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Split long routes into multiple waypoints
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
	const rand = this.rand;
	
	// Plan an egress route (back to the airfield) when target point is not specified
	if (!to) {
		
		const airfield = this.airfields[flight.airfield];
		const lastVector = Vector.create([
			airfield.position[0] - from[0],
			airfield.position[2] - from[1]
		]);
		
		// Use last spot as final egress point (with short final airfield route)
		if (lastVector.modulus() < EGRESS_DISTANCE_MIN) {
			return;
		}
		
		// Make the final route spot (some distance before the airfield)
		const airfieldVector = Vector.create([
			airfield.position[0],
			airfield.position[2]
		]).add(lastVector.toUnitVector().x(
			-1 * rand.real(EGRESS_AIRFIELD_MIN, EGRESS_AIRFIELD_MAX, true)
		));
		
		to = [
			airfieldVector.e(1),
			1000, // FIXME
			airfieldVector.e(2)
		];
	}
	
	const spot = {};
	
	if (options) {
		Object.assign(spot, options);
	}
	
	spot.point = to;
	
	// Use some +-200 meters randomness for each spot point altitude
	spot.point[1] = spot.point[1] + rand.integer(-200, 200);
	
	const speed = makeFlightSpeed.call(this, flight, to[1]);
	
	// Use some ~2% randomness for each spot speed
	spot.speed = Math.round(speed * rand.real(0.99, 1.01));
	
	return [spot];
};