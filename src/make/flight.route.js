/** @copyright Simas Toleikis, 2015 */
"use strict";

const Vector = require("sylvester").Vector;
const makeFlightSpeed = require("./flight.speed");

// Airfield as a target route constants
const AIRFIELD_DISTANCE_EGRESS = 20000; // 20 km
const AIRFIELD_DISTANCE_MIN = 7000; // 7 km
const AIRFIELD_DISTANCE_MAX = 10000; // 10 km

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Split long routes into multiple waypoints
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
	const rand = this.rand;
	let isEgressRoute = false;
	
	// Plan a route to an airfield (instead of a target point)
	if (to.airfield) {
		
		const airfield = this.airfields[to.airfield];
		const lastVector = Vector.create([
			airfield.position[0] - from[0],
			airfield.position[2] - from[2]
		]);
		
		// Egress (back to home airfield) route flag
		isEgressRoute = (to.airfield === flight.airfield);
		
		// Use last spot as final egress point (with short final airfield route)
		if (isEgressRoute && lastVector.modulus() < AIRFIELD_DISTANCE_EGRESS) {
			return;
		}
		
		// Make the final route spot (some distance before the airfield)
		const airfieldVector = Vector.create([
			airfield.position[0],
			airfield.position[2]
		]).add(lastVector.toUnitVector().x(
			-1 * rand.real(AIRFIELD_DISTANCE_MIN, AIRFIELD_DISTANCE_MAX, true)
		));
		
		to.point = [airfieldVector.e(1), airfieldVector.e(2)];
	}
	
	const spot = {};
	
	if (options) {
		Object.assign(spot, options);
	}
	
	let altitude;
	
	// Use a lower altitude for egress (back to home airfield) route
	if (isEgressRoute) {
		altitude = rand.integer(to.altitude.min, to.altitude.target);
	}
	// Use target altitude with some +-150 meters randomness
	else {
		altitude = to.altitude.target + rand.integer(-150, 150);
	}
	
	altitude = Math.min(Math.max(altitude, to.altitude.min), to.altitude.max);
	
	// Route target point with altitude
	spot.point = [
		to.point[0],
		altitude,
		to.point[1]
	];
	
	const speed = makeFlightSpeed.call(this, flight);
	
	// Use some ~2% randomness for each spot speed
	spot.speed = Math.round(speed * rand.real(0.99, 1.01));
	
	return [spot];
};