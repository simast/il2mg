/** @copyright Simas Toleikis, 2015 */
"use strict";

const Vector = require("sylvester").Vector;
const makeFlightSpeed = require("./flight.speed");

// Airfield as a target route constants
const AIRFIELD_DISTANCE_EGRESS = 20000; // 20 km
const AIRFIELD_DISTANCE_MIN = 7000; // 7 km
const AIRFIELD_DISTANCE_MAX = 10000; // 10 km

// Route minimum split segment distance
const ROUTE_SPLIT_DISTANCE = 80000; // 80 km

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
	
	const spotDivider = 1 / numSpots;
	
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
		let spotMultiplier = spotDivider * i;
		
		// Use some +-20% randomness for split spot positioning
		if (!isLastSpot) {
			
			const randomMultiplier = spotDivider * 0.2;
			spotMultiplier += rand.real(-randomMultiplier, randomMultiplier, true);
		}
		
		let spotVector = routeStartVector.add(
			routeVector.multiply(spotMultiplier)
		);
		
		// Use some randomness to shift split points from a straight route line
		// TODO: Avoid placing randomized spots near the edge of map border
		if (!isLastSpot) {
			
			spot.split = true;
			
			const angle60 = Math.PI / 3;
			let rotateMin;
			let rotateMax;
			
			// Use right side rotation with 60 to 120 degrees angle
			if (rand.bool()) {
				
				rotateMin = angle60;
				rotateMax = angle60 * 2;
			}
			// Use left side rotation with 240 to 300 degrees angle
			else {
				
				rotateMin = angle60 * 4;
				rotateMax = angle60 * 5;
			}
			
			const shiftMax = ROUTE_SPLIT_DISTANCE * 0.15;
			const shiftMin = shiftMax / 3;
			
			spotVector = spotVector.add(
				routeVector
					.toUnitVector()
					.multiply(rand.real(shiftMin, shiftMax, true))
					.rotate(rand.real(rotateMin, rotateMax, true), Vector.Zero(2))
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