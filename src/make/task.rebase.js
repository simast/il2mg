/** @copyright Simas Toleikis, 2016 */
"use strict";

const {Vector} = require("sylvester");
const {planAction} = require("../data");
const {isOffmap, getMapIntersection, markMapArea} = require("./map");

// Flight make parts
const makeFlightAltitude = require("./flight.altitude");
const makeFlightRoute = require("./flight.route");
const makeAirfieldTaxi = require("./airfield.taxi");

// Minimum distance required between rebase airfields and map border
const MIN_DISTANCE_AIRFIELD = 20000; // 20 km
const MIN_DISTANCE_BORDER = 40000; // 40 km

// Make mission rebase task
module.exports = function makeTaskRebase(flight) {

	const rand = this.rand;
	const unit = this.units[flight.unit];
	const plan = flight.plan;
	const airfieldFrom = this.airfields[flight.airfield];
	const airfieldTo = this.airfields[rand.pick(unit.rebase)];
	const isPlayerFlight = Boolean(flight.player);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);

	// Make rebase flight altitude profile
	const altitude = makeFlightAltitude.call(this, flight);

	const route =	makeFlightRoute.call(
		this,
		flight,
		airfieldFrom.position,
		airfieldTo.id,
		{
			altitude,
			split: true,
			hidden: (
				isPlayerFlightLeader &&
				!airfieldFrom.offmap &&
				!airfieldTo.offmap &&
				!debugFlights
			),
			solid: true
		}
	);

	// Add rebase task fly action
	plan.push({
		type: planAction.FLY,
		route,
		state: 1,
		visible: isPlayerFlight
	});

	let taxiRouteID;

	plan.land = false;

	// Add rebase task land action
	if (!airfieldTo.offmap) {

		// Pick a random existing target airfield taxi route
		if (airfieldTo.activeTaxiRoutes) {
			taxiRouteID = +rand.pick(Object.keys(airfieldTo.activeTaxiRoutes));
		}
		// Make a new taxi route on target airfield
		else if (airfieldTo.taxi) {

			taxiRouteID = +rand.pick(Object.keys(airfieldTo.taxi));
			makeAirfieldTaxi.call(this, airfieldTo, taxiRouteID);
		}

		const landAction = {
			type: planAction.LAND,
			airfield: airfieldTo.id
		};

		if (taxiRouteID !== undefined) {
			landAction.taxi = taxiRouteID;
		}

		plan.land = plan[plan.push(landAction) - 1];
	}

	if (!airfieldTo.offmap && isPlayerFlight) {

		// Mark target airfield area on the map
		markMapArea.call(this, flight, {
			position: airfieldTo.position,
			centerIcon: true
		});

		// Use target airfield radio navigation beacon
		if (airfieldTo.beacon) {
			flight.beacon = airfieldTo.beacon;
		}
	}

	// Register target airfield location as flight target
	flight.target = [[airfieldTo.position[0], airfieldTo.position[2]]];
};

// Check if rebase task is valid for target position/point
function isValidRebaseTask(airfieldFrom, airfieldTo, map) {

	let validationCache = isValidRebaseTask.validationCache;

	// Initialize rebase task validation cache
	if (!validationCache) {
		validationCache = isValidRebaseTask.validationCache = new Map();
	}

	// Lookup cache data
	let cacheFrom = validationCache.get(airfieldFrom);

	if (cacheFrom) {

		const isValid = cacheFrom.get(airfieldTo);

		if (isValid !== undefined) {
			return isValid;
		}
	}

	const isValid = (() => {

		const fromVector = Vector.create(airfieldFrom.position);
		const toVector = Vector.create(airfieldTo.position);
		const distance = fromVector.distanceFrom(toVector);

		// Enforce required minimum distance between rebase airfields
		if (distance < MIN_DISTANCE_AIRFIELD) {
			return false;
		}

		const isOffmapFrom = isOffmap(map, fromVector);
		const isOffmapTo = isOffmap(map, toVector);

		// Offmap-to-offmap airfield rebase tasks are invalid
		if (isOffmapFrom && isOffmapTo) {
			return false;
		}

		// Avoid rebase tasks near the edge of the map border
		if (isOffmapFrom || isOffmapTo) {

			const {borderPlane} = getMapIntersection(map, fromVector, toVector, distance);
			let distanceBorder = false;

			if (borderPlane) {

				// Flying outside the map
				if (isOffmapTo) {
					distanceBorder = borderPlane.distanceFrom(fromVector);
				}
				// Flying inside the map
				else {
					distanceBorder = borderPlane.distanceFrom(toVector);
				}
			}

			// Enforce required minimum distance between map border
			if (distanceBorder === false || distanceBorder < MIN_DISTANCE_BORDER) {
				return false;
			}
		}

		return true;
	})();

	// Update validation cache
	if (!cacheFrom) {

		cacheFrom = new Map();
		validationCache.set(airfieldFrom, cacheFrom);
	}

	cacheFrom.set(airfieldTo, isValid);

	return isValid;
}

module.exports.isValidRebaseTask = isValidRebaseTask;