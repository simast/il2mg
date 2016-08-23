/** @copyright Simas Toleikis, 2016 */
"use strict";

const {planAction} = require("../data");
const {Vector, Line, Sylvester} = require("sylvester");
const {markMapArea} = require("./task.cover");
const {isOffmapPoint} = require("./map");

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
		{
			altitude,
			airfield: airfieldTo.id,
			split: true
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
		
		const vectorFrom = Vector.create([airfieldFrom.position[0], airfieldFrom.position[2]]);
		const vectorTo = Vector.create([airfieldTo.position[0], airfieldTo.position[2]]);
		const distance = vectorFrom.distanceFrom(vectorTo);
		
		// Enforce required minimum distance between rebase airfields
		if (distance < MIN_DISTANCE_AIRFIELD) {
			return false;
		}
		
		const isOffmapFrom = isOffmapPoint(vectorFrom.e(1), vectorFrom.e(2), map.width, map.height);
		const isOffmapTo = isOffmapPoint(vectorTo.e(1), vectorTo.e(2), map.width, map.height);
			
		// Offmap-to-offmap airfield rebase tasks are invalid
		if (isOffmapFrom && isOffmapTo) {
			return false;
		}
		
		// Avoid rebase tasks near the edge of the map border
		if (isOffmapFrom || isOffmapTo) {
			
			const mapBorderLines = [
				Line.create([0, 0], [1, 0]), // Left
				Line.create([map.height, 0], [0, 1]), // Top
				Line.create([map.height, map.width], [-1, 0]), // Right
				Line.create([0, map.width], [0, -1]) // Bottom
			];
			
			const routeLine = Line.create(vectorFrom, Vector.create([
				vectorTo.e(1) - vectorFrom.e(1),
				vectorTo.e(2) - vectorFrom.e(2)
			]));
			
			let distanceBorder = false;
			
			// Test each map border for intersections
			for (const borderLine of mapBorderLines) {
				
				let vectorIntersect = borderLine.intersectionWith(routeLine);
				
				if (!vectorIntersect) {
					continue;
				}
			
				const isOffmapIntersect = isOffmapPoint(
					Math.round(vectorIntersect.e(1)),
					Math.round(vectorIntersect.e(2)),
					map.width, map.height
				);
				
				// Ignore offmap intersection points
				if (isOffmapIntersect) {
					continue;
				}
				
				// Convert back to 2D vector
				vectorIntersect = Vector.create([
					vectorIntersect.e(1),
					vectorIntersect.e(2)
				]);
				
				const distanceIntersectA = vectorFrom.distanceFrom(vectorIntersect);
				const distanceIntersectB = vectorIntersect.distanceFrom(vectorTo);
				const distanceDelta = Math.abs(distance - (distanceIntersectA + distanceIntersectB));
				
				// Ignore invalid intersection points
				if (distanceDelta > Sylvester.precision) {
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