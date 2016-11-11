/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Vector} = require("sylvester");

// Flight make parts
const makeFlightSpeed = require("./flight.speed");
const makeFlightAltitude = require("./flight.altitude");

// Airfield as a target route constants
const AIRFIELD_DISTANCE_EGRESS = 20000; // 20 km
const AIRFIELD_DISTANCE_MIN = 7000; // 7 km
const AIRFIELD_DISTANCE_MAX = 10000; // 10 km

// Route minimum split segment distance
const ROUTE_SPLIT_DISTANCE = 80000; // 80 km

// Make mission flight route
module.exports = function makeFlightRoute(flight, fromPosition, toPoint, options = {}) {

	// TODO: Adjust to waypoint altitude based on plane climb rate
	// TODO: Use path-finding to avoid enemy airfields
	// TODO: Use landmarks (places, rivers) for navigation

	const rand = this.rand;
	let isEgressRoute = false;
	let altitudeProfile = options.altitude;

	// Make a new flight altitude profile
	if (!altitudeProfile) {
		altitudeProfile = makeFlightAltitude.call(this, flight);
	}

	// Plan a route to an airfield (instead of a target point)
	if (typeof toPoint === "string") {

		const airfield = this.airfields[toPoint];
		const airfieldPosition = airfield.position;

		// Egress (back to home airfield) route flag
		isEgressRoute = (airfield.id === flight.airfield);

		// Use offmap airfield position as final point
		if (airfield.offmap) {
			toPoint = [airfieldPosition[0], airfieldPosition[2]];
		}
		else {

			const routeVector = Vector.create([
				airfieldPosition[0] - fromPosition[0],
				airfieldPosition[2] - fromPosition[2]
			]);

			// Use last spot as final egress point (with short final airfield route)
			if (isEgressRoute && routeVector.modulus() < AIRFIELD_DISTANCE_EGRESS) {
				return;
			}

			// Make the final route spot (some distance before the airfield)
			toPoint = Vector.create([
				airfieldPosition[0],
				airfieldPosition[2]
			]).add(routeVector.toUnitVector().multiply(
				-1 * rand.real(AIRFIELD_DISTANCE_MIN, AIRFIELD_DISTANCE_MAX, true)
			)).elements;
		}
	}

	const route = [];
	const routeStartVector = Vector.create([fromPosition[0], fromPosition[2]]);
	const routeVector = Vector.create([
		toPoint[0] - fromPosition[0],
		toPoint[1] - fromPosition[2]
	]);

	let numSpots = 1;

	// Use more than one route spot when splitting is allowed
	if (options.split) {
		numSpots = Math.ceil(routeVector.modulus() / ROUTE_SPLIT_DISTANCE);
	}

	const spotDivider = 1 / numSpots;

	for (let i = 1; i <= numSpots; i++) {

		const isLastSpot = (i === numSpots);

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

		const spot = {};

		Object.assign(spot, options);

		// Use some randomness to shift split points from a straight route line
		// TODO: Avoid placing randomized spots near the edge of map border
		if (!isLastSpot) {

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
		else {
			delete spot.split;
		}

		let altitude;

		// Use a lower altitude for egress (back to home airfield) route
		if (isEgressRoute && isLastSpot) {
			altitude = rand.integer(altitudeProfile.min, altitudeProfile.target);
		}
		// Use target altitude with some +-150 meters randomness
		else {
			altitude = altitudeProfile.target + rand.integer(-150, 150);
		}

		altitude = Math.max(altitude, altitudeProfile.min);
		altitude = Math.min(altitude, altitudeProfile.max);

		// Route target point with altitude
		spot.position = [
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

// Get flight route distance
function getRouteDistance(startPosition, route) {

	// TODO: Refactor route iteration logic to a separate walkRoute() function

	let routeDistance = 0;
	let prevSpotVector = Vector.create(startPosition);
	let spotIndex = 0;
	let loopSpotIndex;
	let loopTime;

	// Iterate route spots
	while (route[spotIndex]) {

		const spot = route[spotIndex];

		// Handle special loop pattern route marker
		if (Array.isArray(spot)) {

			// Initialize loop marker data
			if (loopSpotIndex === undefined) {

				loopSpotIndex = spotIndex;
				loopTime = spot[1];
			}

			// Apply loop marker offset
			spotIndex = spotIndex + spot[0];

			continue;
		}

		let spotVector = Vector.create(spot.position);
		let segmentDistance = spotVector.distanceFrom(prevSpotVector);

		// Calculate distance based on loop time and flight speed
		if (loopSpotIndex !== undefined) {

			const distancePerSecond = spot.speed * 1000 / 3600;
			const remainingDistance = loopTime * distancePerSecond;

			// Use full segment distance as is
			if (remainingDistance >= segmentDistance) {
				loopTime -= (segmentDistance / distancePerSecond);
			}
			// Use part of segment distance based on remaining loop time
			else {

				spotVector = spotVector
					.subtract(prevSpotVector)
					.toUnitVector()
					.multiply(remainingDistance)
					.add(prevSpotVector);

				loopTime = 0;
				segmentDistance = remainingDistance;
			}

			// Loop marker was completed
			if (loopTime <= 0) {

				spotIndex = loopSpotIndex;
				loopSpotIndex = loopTime = undefined;
			}
		}

		routeDistance += segmentDistance;
		prevSpotVector = spotVector;
		spotIndex++;
	}

	return routeDistance;
}

module.exports.getRouteDistance = getRouteDistance;