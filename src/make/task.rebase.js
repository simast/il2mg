/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");
const math = require("mathjs");
const {markMapArea} = require("./task.cover");
const {isOffmapPoint} = require("./map");

// Flight make parts
const makeFlightAltitude = require("./flight.altitude");
const makeFlightRoute = require("./flight.route");
const makeAirfieldTaxi = require("./airfield.taxi");

// Minimum distance required between rebase airfields and map border
const MIN_DISTANCE_AIRFIELD = 20000; // 20 km
const MIN_DISTANCE_BORDER = 40000; // 40 km

// Data constants
const planAction = data.planAction;

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
		{
			altitude,
			airfield: airfieldTo.id
		},
		{
			hidden: (isPlayerFlightLeader && !debugFlights),
			solid: true
		}
	);
	
	// Add rebase task fly action
	plan.push({
		type: planAction.FLY,
		route,
		altitude,
		visible: isPlayerFlight
	});
	
	let taxiRouteID;
	
	plan.land = true;
	
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
		
		plan.land = plan[plan.push({
			type: planAction.LAND,
			airfield: airfieldTo.id,
			taxi: taxiRouteID
		}) - 1];
	}
	
	if (!airfieldTo.offmap && isPlayerFlight) {
		
		// Mark target airfield area on the map
		markMapArea.call(
			this,
			flight,
			airfieldTo.position[0],
			airfieldTo.position[2],
			true
		);
		
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
	
		const pointFrom = [airfieldFrom.position[0], airfieldFrom.position[2]];
		const pointTo = [airfieldTo.position[0], airfieldTo.position[2]];
		const distance = math.distance(pointFrom, pointTo);
		
		// Enforce required minimum distance between rebase airfields
		if (distance < MIN_DISTANCE_AIRFIELD) {
			return false;
		}
		
		const isOffmapFrom = isOffmapPoint(pointFrom[0], pointFrom[1], map.width, map.height);
		const isOffmapTo = isOffmapPoint(pointTo[0], pointTo[1], map.width, map.height);
			
		// Offmap-to-offmap airfield rebase tasks are invalid
		if (isOffmapFrom && isOffmapTo) {
			return false;
		}
		
		// Avoid rebase tasks near the edge of the map border
		if (isOffmapFrom || isOffmapTo) {
		
			const mapBorderLines = [
				[[0, 0], [map.height, 0]], // Left
				[[map.height, 0], [map.height, map.width]], // Top
				[[map.height, map.width], [0, map.width]], // Right
				[[0, map.width], [0, 0]] // Bottom
			];
			
			let distanceBorder = false;
			
			// Test each map border for intersections
			for (const [borderPointFrom, borderPointTo] of mapBorderLines) {
				
				const pointIntersect = math.intersect(
					pointFrom, pointTo,
					borderPointFrom, borderPointTo
				);
				
				if (!pointIntersect) {
					continue;
				}
			
				const isOffmapIntersect = isOffmapPoint(
					Math.round(pointIntersect[0]),
					Math.round(pointIntersect[1]),
					map.width, map.height
				);
				
				// Ignore offmap intersection points
				if (isOffmapIntersect) {
					continue;
				}
				
				const distanceIntersectA = math.distance(pointFrom, pointIntersect);
				const distanceIntersectB = math.distance(pointIntersect, pointTo);
				
				// Ignore invalid intersection points
				if (!math.equal(distanceIntersectA + distanceIntersectB, distance)) {
					continue;
				}
				
				// Flying outside the map
				if (isOffmapTo) {
					distanceBorder = distanceIntersectA;
				}
				// Flying inside the map
				else {
					distanceBorder = distanceIntersectB;
				}
				
				break;
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