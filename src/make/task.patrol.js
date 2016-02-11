/** @copyright Simas Toleikis, 2016 */
"use strict";

const Vector = require("sylvester").Vector;
const data = require("../data");
const Location = require("./locations").Location;
const makeFlightRoute = require("./flight.route");
const MCU_Icon = require("../item").MCU_Icon;

// Extra patrol zone padding (used to enclose patrol points)
const ZONE_PADDING = 1500; // 1.5 Km

// Data constants
const planAction = data.planAction;
const territory = data.territory;
const mapColor = data.mapColor;

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
	let totalX = 0;
	let totalZ = 0;
	
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
		
		// Collect X/Z coordinate totals (to get average patrol area center point)
		totalX += point[0];
		totalZ += point[1];
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
				// Don't show map egress route lines for patrol task
				hidden: true
			}
		)
	);
	
	// Add patrol task fly action
	flight.plan.push({
		type: planAction.FLY,
		route: route,
		visible: Boolean(flight.player) && !isPlayerFlightLeader
	});
	
	// Draw patrol area zone only when player is a flight leader
	if (!isPlayerFlightLeader) {
		return;
	}
	
	const zoneVectors = [];
	const zoneOrigin = Vector.Zero(2);
	const zoneXAxis = Vector.create([1, 0]);
	const zoneCenter = Vector.create([
		totalX / patrolPoints.length,
		totalZ / patrolPoints.length
	]);
	
	// Build list of zone vectors (translated to 0,0 origin coordinate)
	for (const point of patrolPoints) {
		
		let vector = Vector.create([
			point[0] - zoneCenter.e(1),
			point[1] - zoneCenter.e(2)
		]);
		
		// Compute vector angle (from X coordinate axis)
		let vectorAngleX = zoneXAxis.angleFrom(vector);
		
		// NOTE: Convert to full 2π range as angleFrom() returns from 0 to +π
		if (vector.e(2) < 0) {
			vectorAngleX = Math.PI + (Math.PI - vectorAngleX);
		}
		
		const zonePadding = Vector.create([ZONE_PADDING, 0])
			.rotate(vectorAngleX, zoneOrigin);
		
		vector = vector.add(zonePadding);
		vector._angleX = vectorAngleX; // Used in sorting
		
		zoneVectors.push(vector);
	}
	
	// Sort zone vectors based on angle from origin X coordinate
	zoneVectors.sort((a, b) => {
		return a._angleX - b._angleX;
	});
	
	let firstZoneIcon;
	let lastZoneIcon;
	
	// Draw patrol area zone
	for (let vector of zoneVectors) {
		
		// Translate 0,0 origin vector back to original position
		vector = zoneCenter.add(vector);
		
		const zoneIcon = flight.group.createItem("MCU_Icon");
		
		zoneIcon.setPosition(vector.e(1), altitude, vector.e(2));
		zoneIcon.setColor(mapColor.ROUTE);
		zoneIcon.Coalitions = [flight.coalition];
		zoneIcon.LineType = MCU_Icon.LINE_SECTOR_2;
		
		if (!firstZoneIcon) {
			firstZoneIcon = zoneIcon;
		}
		else {
			lastZoneIcon.addTarget(zoneIcon);
		}
		
		lastZoneIcon = zoneIcon;
	}
	
	// Connect zone icons in a loop
	lastZoneIcon.addTarget(firstZoneIcon);
};