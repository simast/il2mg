/** @copyright Simas Toleikis, 2015 */
"use strict";

const Vector = require("sylvester").Vector;
const makeFlightSpeed = require("./flight.speed");

// Airfield as a target route constants
const AIRFIELD_DISTANCE_EGRESS = 20000; // 20 km
const AIRFIELD_DISTANCE_MIN = 7000; // 7 km
const AIRFIELD_DISTANCE_MAX = 10000; // 10 km

// Route split distance constants
const ROUTE_SPLIT_DISTANCE = 80000; // 80 km
const ROUTE_SPLIT_RANDOM = ROUTE_SPLIT_DISTANCE * 0.05; // 5% (+- 4km)

// Make mission flight route
module.exports = function makeFlightRoute(flight, from, to, options) {
	
	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation
	
	const rand = this.rand;
	let isEgressRoute = false;
	
	// Plan a route to an airfield (instead of a target point)
	if (to.airfield) {
		
		const airfield = this.airfields[to.airfield];
		const airfieldPosition = airfield.position;
		const routeVector = Vector.create([
			airfieldPosition[0] - from[0],
			airfieldPosition[2] - from[2]
		]);
		
		// Egress (back to home airfield) route flag
		isEgressRoute = (to.airfield === flight.airfield);
		
		// Use last spot as final egress point (with short final airfield route)
		if (isEgressRoute && routeVector.modulus() < AIRFIELD_DISTANCE_EGRESS) {
			return;
		}
		
		// Make the final route spot (some distance before the airfield)
		const routeEndVector = Vector.create([
			airfieldPosition[0],
			airfieldPosition[2]
		]).add(routeVector.toUnitVector().multiply(
			-1 * rand.real(AIRFIELD_DISTANCE_MIN, AIRFIELD_DISTANCE_MAX, true)
		));
		
		to.point = [routeEndVector.e(1), routeEndVector.e(2)];
	}
	
	const route = [];
	const routeStartVector = Vector.create([from[0], from[2]]);
	const routeVector = Vector.create([
		to.point[0] - from[0],
		to.point[1] - from[2]
	]);
	
	let numSpots = 1;
	
	// Use more than one route spot when splitting is allowed
	if (to.split) {
		numSpots = Math.ceil(routeVector.modulus() / ROUTE_SPLIT_DISTANCE);
	}
	
	for (let i = 1; i <= numSpots; i++) {
		
		const spot = {};
		const isLastSpot = (i === numSpots);
		
		if (options) {
			Object.assign(spot, options);
		}
		
		let altitude;
		
		// Use a lower altitude for egress (back to home airfield) route
		if (isEgressRoute && isLastSpot) {
			altitude = rand.integer(to.altitude.min, to.altitude.target);
		}
		// Use target altitude with some +-150 meters randomness
		else {
			altitude = to.altitude.target + rand.integer(-150, 150);
		}
		
		altitude = Math.min(Math.max(altitude, to.altitude.min), to.altitude.max);
		
		// Compute route spot vector position
		let spotVector = routeStartVector.add(
			routeVector.multiply(1 / numSpots * i)
		);
		
		// Add some randomness for split points
		// TODO: Avoid placing spots near the edge of map border
		if (!isLastSpot) {
			
			spotVector = spotVector.add(
				routeVector
					.toUnitVector()
					.multiply(rand.real(0, ROUTE_SPLIT_RANDOM, true))
					.rotate(rand.real(0, Math.PI * 2, true), Vector.Zero(2))
			);
		}
		
		// Route target point with altitude
		spot.point = [
			spotVector.e(1),
			altitude,
			spotVector.e(2)
		];
		
		const speed = makeFlightSpeed.call(this, flight);
		
		// Use some ~2% randomness for each spot speed
		spot.speed = Math.round(speed * rand.real(0.99, 1.01));
		
		route.push(spot);
	}
	
	return route;
};