/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");
const Location = require("./locations").Location;
const makeFlightRoute = require("./flight.route");

// Data constants
const planAction = data.planAction;
const territory = data.territory;

// Make mission defensive patrol task
module.exports = function makeTaskPatrol(flight) {
	
	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const territories = this.locations.territories;
	const patrolStart = new Location(airfield.position[0], airfield.position[2]);
	
	// Max patrol area range is 25% of max aircraft fuel range
	const maxPlaneRange = this.planes[flight.leader.plane].range * 1000;
	const maxPatrolRange = maxPlaneRange * 0.25;
	
	// Patrol area bounds as a rectangular location around the start point
	const patrolBounds = new Location(
		patrolStart.x - maxPatrolRange,
		patrolStart.z - maxPatrolRange,
		patrolStart.x + maxPatrolRange,
		patrolStart.z + maxPatrolRange
	);
	
	// Min/max distance for patrol area points (depends on max aircraft range)
	const minArea = maxPlaneRange / 20; // 5% max range
	const maxArea = maxPlaneRange / 10; // 10% max range
	
	let patrolA;
	let patrolB;
	
	// Select base two (A and B) front points for patrol area
	const findPatrolPoints = (locations) => {
		
		if (!locations.length) {
			return;
		}
		
		// Make sure location selection is randomized
		rand.shuffle(locations);
		
		do {
			
			const location = locations.shift();
			const locationVector = location.vector;
			const distance = patrolStart.vector.distanceFrom(locationVector);
			
			// Ignore front points outside max patrol range
			// NOTE: Required as search results from r-tree are within rectangle bounds
			if (distance > maxPatrolRange) {
				continue;
			}
			
			// NOTE: Chance to use this location will decrease with distance (with
			// at least 10% always guaranteed chance).
			const useLocation = rand.bool(Math.max(0.1, 1 - (distance / maxPatrolRange)));
			
			// Use location for another chance pass
			if (!useLocation && locations.length) {
				
				locations.push(location);
				continue;
			}
			
			// Pick location A
			if (!patrolA) {
				patrolA = location;
			}
			// Pick location B
			else {
				
				const distanceAB = patrolA.vector.distanceFrom(locationVector);
				
				// Search for a location matching min/max patrol area bounds
				if (distanceAB >= minArea && distanceAB <= maxArea) {
					
					patrolB = location;
					break; // Found both locations
				}
			}
		}
		while (locations.length);
	};
	
	// Option 1: Find patrol points from fronts within max patrol range
	findPatrolPoints(territories[territory.FRONT].findIn(patrolBounds));
	
	// Option 2: Find patrol points on friendly territory within max patrol range
	if (!patrolA || !patrolB) {
		
		// TODO: Use enemy offmap airfields as a reference for front direction
		findPatrolPoints(territories[flight.coalition].findIn(patrolBounds));
	}
	
	const route = [];
	let fromPoint = airfield.position;
	
	// TODO: Generate two additional patrol area points
	for (const location of [patrolA, patrolB]) {
		
		const options = {};
		
		// Hide route map lines for patrol area spots
		if (location !== patrolA) {
			options.hidden = true;
		}
		// Mark route as ingress
		else {
			options.ingress = true;
		}
		
		const toPoint = [
			rand.integer(location.x1, location.x2),
			1500, // TODO
			rand.integer(location.z1, location.z2)
		];
		
		const spots = makeFlightRoute.call(this, flight, fromPoint, toPoint, options);
		
		route.push.apply(route, spots);
		fromPoint = spots.pop().point;
	}
	
	// Make final (back to the base) egress route
	route.push.apply(
		route,
		makeFlightRoute.call(this, flight, fromPoint, null, {egress: true})
	);
	
	// Add patrol task fly action
	flight.plan.push({
		type: planAction.FLY,
		route: route
	});
};