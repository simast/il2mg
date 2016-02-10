/** @copyright Simas Toleikis, 2016 */
"use strict";

const Vector = require("sylvester").Vector;
const data = require("../data");
const Location = require("./locations").Location;
const makeFlightRoute = require("./flight.route");

// Data constants
const planAction = data.planAction;
const territory = data.territory;

// Make mission patrol area task
module.exports = function makeTaskPatrol(flight) {
	
	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const territories = this.locations.territories;
	const startLocation = new Location(airfield.position[0], airfield.position[2]);
	const startVector = startLocation.vector;
	const isPlayerFlightLeader = (flight.player === flight.leader);
	
	// Max patrol area range is 25% of max aircraft fuel range
	const maxPlaneRange = this.planes[flight.leader.plane].range * 1000;
	const maxPatrolRange = maxPlaneRange * 0.25;
	
	// Patrol area bounds as a rectangular location around the start point
	const patrolBounds = new Location(
		startLocation.x - maxPatrolRange,
		startLocation.z - maxPatrolRange,
		startLocation.x + maxPatrolRange,
		startLocation.z + maxPatrolRange
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
			const distance = startVector.distanceFrom(locationVector);
			
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
	
	const patrolPoints = [];
	
	// Build base patrol area points
	for (const location of rand.shuffle([patrolA, patrolB])) {
		
		patrolPoints.push([
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		]);
	}
	
	// TODO: Use less extra points for larger patrol areas?
	const numExtraPoints = rand.integer(1, 2);
	
	// Generate one or two additional patrol area points
	for (let p = 0; p < numExtraPoints; p++) {
		
		const pointA = patrolPoints[p];
		const pointB = patrolPoints[(p + 1) % 2];
		
		// Distance vector between both base points
		let vectorAB = Vector.create([
			pointB[0] - pointA[0],
			pointB[1] - pointA[1]
		]);
		
		// Rotate vector to the right by random angle
		// TODO: Use lower rotation angles for larger patrol areas?
		const rotMin = Math.PI / 6; // 30 degrees in radians
		const rotMax = Math.PI / 3; // 60 degrees in radians
		const rotDelta = rotMax - rotMin; // 30 degrees in radians
		const rotAngle = rand.real(rotMin, rotMax, true);
		
		vectorAB = vectorAB.rotate(rotAngle, Vector.Zero(2));
		
		// Scale vector based on the rotation
		const scaleMin = 1 / 3; // 33%
		const scaleMax = 1 - 1 / 3; // 66%
		const scaleDelta = scaleMax - scaleMin; // 33%
		const scaleFactor = scaleMin + scaleDelta * (1 - (rotAngle - rotMin) / rotDelta);
		
		vectorAB = vectorAB.multiply(scaleFactor);
		
		// Build final (result) point vector
		const pointVector = Vector.create(pointA).add(vectorAB);
		
		patrolPoints.push([
			Math.round(pointVector.e(1)),
			Math.round(pointVector.e(2))
		]);
	}
	
	// Sort patrol area points based on distance from patrol start
	patrolPoints.sort((a, b) => {
		
		const distanceA = startVector.distanceFrom(Vector.create(a));
		const distanceB = startVector.distanceFrom(Vector.create(b));
		
		return distanceA - distanceB;
	});
	
	// NOTE: The first (ingress) patrol point will always be the closest one and
	// the rest will be shuffled (may produce intersecting pattern with 4 points).
	let ingressPoint = patrolPoints.shift();
	rand.shuffle(patrolPoints);
	patrolPoints.unshift(ingressPoint);
	
	// TODO: Set patrol altitude based on plane type and cloud coverage
	const altitude = 1500;
	
	const route = [];
	let loopSpotIndex = 0;
	let fromPoint = airfield.position;
	
	// Build patrol area route points
	for (const point of patrolPoints) {
		
		const options = Object.create(null);
		
		// Mark route as ingress
		if (point === ingressPoint) {
			options.ingress = true;
		}
		
		// Plan patrol flight route for each point
		const spots = makeFlightRoute.call(
			this,
			flight,
			fromPoint,
			[point[0], altitude, point[1]],
			options
		);
		
		route.push.apply(route, spots);
		fromPoint = spots.pop().point;
		
		// Mark spot index for a repeating patrol loop pattern
		if (point === ingressPoint) {
			
			ingressPoint = fromPoint;
			loopSpotIndex = route.length - 1;
		}
	}
	
	// Add loop pattern route marker (back to ingress point)
	// TODO: Set loop pattern fly time!
	route.push([loopSpotIndex, 60 * 10]);
	
	// Make final (back to the base) egress route
	route.push.apply(
		route,
		makeFlightRoute.call(
			this,
			flight,
			ingressPoint,
			null, // Use flight airfield
			{
				egress: true,
				hidden: true // Don't show map egress route lines for patrol task
			}
		)
	);
	
	// Add patrol task fly action
	flight.plan.push({
		type: planAction.FLY,
		route: route,
		draw: Boolean(flight.player) && !isPlayerFlightLeader
	});
	
	// TODO: Draw patrol area zone when player is flight leader
};