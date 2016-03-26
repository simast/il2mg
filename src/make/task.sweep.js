/** @copyright Simas Toleikis, 2016 */
"use strict";

const Vector = require("sylvester").Vector;
const data = require("../data");
const Location = require("./locations").Location;
const Item = require("../item");
const findBasePoints = require("./task.patrol").findBasePoints;
const getTerritory = require("./fronts").getTerritory;

// Flight make parts
const makeFlightAltitude = require("./flight.altitude");
const makeFlightRoute = require("./flight.route");

// Max fighter sweep route range (as a percent from total aircraft fuel range)
const MAX_RANGE_PERCENT = 75;

// Min/max angle between two base reference points (in degrees)
const MIN_ANGLE = 30;
const MAX_ANGLE = 120;

// Min/max distance between two base reference points (in meters)
const MIN_DISTANCE = 20000;
const MAX_DISTANCE = 120000;

// Data constants
const planAction = data.planAction;
const territory = data.territory;
const mapColor = data.mapColor;

// Make mission fighter sweep task
module.exports = function makeTaskSweep(flight) {
	
	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const startX = airfield.position[0];
	const startZ = airfield.position[2];
	const startLocation = new Location(startX, startZ);
	const startVector = startLocation.vector;
	const territories = this.locations.territories;
	const originVector = Vector.Zero(2);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);
	
	// Max fighter sweep route range based on max aircraft fuel range
	const maxPlaneRange = this.planes[flight.leader.plane].range * 1000;
	const maxRouteRange = maxPlaneRange * (MAX_RANGE_PERCENT / 100);
	const maxRouteRangeSegment = Math.round(maxRouteRange / 3);
	
	// Find base two fighter sweep reference points
	const points = findBasePoints.call(this, flight, {
		start: startLocation,
		maxRange: maxRouteRangeSegment,
		minDistance: MIN_DISTANCE,
		maxDistance: MAX_DISTANCE,
		minAngle: MIN_ANGLE,
		maxAngle: MAX_ANGLE
	});
	
	// TODO: Reject task when we can't find base two reference points
	
	// Make a valid point (shifting to valid map area if necessary)
	const makeValidPoint = (pointVector, originVector) => {
		
		const originX = originVector.e(1);
		const originZ = originVector.e(2);
		let point = [pointVector.e(1), pointVector.e(2)];
		
		while (!points.isValid(point)) {
			
			// Cut distance by 10% for each iteration
			pointVector = Vector.create([
				point[0] - originX,
				point[1] - originZ
			]).multiply(0.9);
			
			pointVector = originVector.add(pointVector);
			point = [pointVector.e(1), pointVector.e(2)];
		}
		
		return point;
	};
	
	const sweepPoints = [];
	let ingressPoint, ingressVector;
	let egressPoint, egressVector;
	let routeRange = 0;
	let rotateDirection = 1;
	
	// Step 1: Make base ingress/egress points
	for (let location of rand.shuffle([points.a, points.b])) {
		
		// Clone and randomize initial location point
		location = new Location(
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		);
		
		let shiftVector = false;
		
		// Use shift vector
		if (getTerritory(location.x, location.z) === territory.FRONT) {
			
			shiftVector = Vector.create([
				location.x - startX,
				location.z - startZ
			]).toUnitVector();
			
			location = startLocation;
		}
		
		// Constants used for shifting initial ingress/egress points
		const minShiftDistance = 1000; // 1 km
		const maxShiftDistance = 1500; // 1.5 km
		const minFrontDistance = 4000; // 4 km
		
		// Find nearest front line following shift vector (from starting location)
		while (shiftVector) {
			
			const locationVector = location.vector;
			const nearestFront = territories[territory.FRONT].findNear(location, 1);
			
			// Make sure ingress/egress point is some distance away from front lines
			if (nearestFront.length &&
				locationVector.distanceFrom(nearestFront[0].vector) < minFrontDistance) {
				
				break;
			}
			
			// Shift point forwards
			const pointVector = locationVector.add(
				shiftVector.multiply(rand.integer(minShiftDistance, maxShiftDistance))
			);
			
			const posX = pointVector.e(1);
			const posZ = pointVector.e(2);
			
			// End shift when we reach front lines
			if (getTerritory(posX, posZ) !== flight.coalition) {
				break;
			}
			
			location = new Location(posX, posZ);
		}
		
		const pointX = location.x;
		const pointZ = location.z;
		const point = [pointX, pointZ];
		const pointVector = Vector.create([
			pointX - startX,
			pointZ - startZ
		]);
		
		if (!ingressPoint) {
			
			ingressPoint = point;
			ingressVector = pointVector.toUnitVector();
		}
		else {
			
			egressPoint = point;
			egressVector = pointVector.toUnitVector();
		}
		
		// Track total route range/distance
		routeRange += pointVector.modulus();
	}
	
	// Step 2: Make the middle (distance) point
	{
		let pointVector = Vector.create([
			ingressPoint[0] - startX,
			ingressPoint[1] - startZ
		]).toUnitVector();
		
		// Set random middle point distance (from the starting position)
		pointVector = pointVector.multiply(rand.integer(
			Math.round(maxRouteRangeSegment - routeRange / 2),
			maxRouteRangeSegment
		));
		
		// Translate middle point vector back to the world coordinate origin
		pointVector = startVector.add(pointVector);
		
		// Rotate middle point vector
		const rotateAngle = ingressVector.angleFrom(egressVector);
		const rotateAngleMin = rotateAngle / 3;
		const rotateAngleMax = rotateAngleMin * 2;
		const rotateCheck = ingressVector.rotate(rotateAngle, originVector);
		
		rotateDirection = rotateCheck.eql(egressVector) ? 1 : -1;
		
		pointVector = pointVector.rotate(
			rotateDirection * rand.real(rotateAngleMin, rotateAngleMax, true),
			startVector
		);
		
		// Register middle point
		sweepPoints.push(makeValidPoint(pointVector, startVector));
	}
	
	// Step 3: Make the fourth (side) point
	{
		const middlePoint = sweepPoints[0];
		const enemyCoalition = this.getEnemyCoalition(flight.coalition);
		const results = {
			weighted: []
		};
		
		// Scan each side and build a weighted list of fourth point directions
		for (const basePoint of [ingressPoint, egressPoint]) {
			
			const result = Object.create(null);
			const isIngress = (basePoint === ingressPoint);
			const rotation = isIngress ? -1 : 1;
			const baseVector = Vector.create([basePoint[0], basePoint[1]]);
			
			if (isIngress) {
				results.ingress = result;
			}
			else {
				results.egress = result;
			}
			
			// Use the center of base and middle points
			let sideVector = Vector.create([
				middlePoint[0] - basePoint[0],
				middlePoint[1] - basePoint[1]
			]).multiply(0.5);
			
			// Perpendicular direction vector (rotated 90 degrees to the outer side)
			const directionVector = sideVector.toUnitVector().rotate(
				rotation * rotateDirection * Math.PI / 2,
				originVector
			);
			
			result.distance = sideVector.modulus();
			result.directionVector = directionVector;
			result.sideVector = sideVector = baseVector.add(sideVector);
			
			const scanDistance = 10000; // 10 km
			let scanIteration = 1;
			let scanTerritory;
			
			// Scan side for enemy territories
			do {
				
				const scanVector = sideVector.add(
					directionVector.multiply(scanIteration * scanDistance)
				);
				
				const posX = scanVector.e(1);
				const posZ = scanVector.e(2);
				
				scanTerritory = getTerritory(posX, posZ);
				
				// Found enemy territory over the scan direction
				if (scanTerritory === enemyCoalition) {
					results.weighted.push(result);
				}
				
				scanIteration++;
			}
			while (scanTerritory !== territory.UNKNOWN);
		}
		
		let side;
		
		// Pick random/valid side for the fourth point
		if (!results.weighted.length) {
			side = rand.pick([results.ingress, results.egress]);
		}
		else {
			side = rand.pick(results.weighted);
		}
		
		const sideRotateMax = (Math.PI / 4); // 45 degrees
		const sideRotate = rand.real(-(sideRotateMax / 2), sideRotateMax / 2, true);
		
		// Make fourth side point
		const pointVector = side.sideVector.add(side.directionVector
			.rotate(sideRotate, originVector)
			.multiply(side.distance * rand.real(0.5, 1.5, true))
		);
		
		sweepPoints.push(makeValidPoint(pointVector, side.sideVector));
	}
	
	// Randomize middle and side point order (may produce intersecting pattern)
	rand.shuffle(sweepPoints);
	
	// Register ingress/egress points
	sweepPoints.unshift(ingressPoint);
	sweepPoints.push(egressPoint);
	
	// Make fighter sweep altitude
	const altitude = makeFlightAltitude.call(this, flight);
	
	const route = [];
	let fromPoint = airfield.position;
	
	// Build fighter sweep route points
	for (const point of sweepPoints) {
		
		const options = Object.create(null);
		
		// Mark route as ingress
		if (point === ingressPoint) {
			
			options.ingress = true;
			
			// Hide ingress route when player is flight leader
			if (isPlayerFlightLeader && !debugFlights) {
				options.hidden = true;
			}
		}
		
		// Plan fighter sweep route for each point
		const spots = makeFlightRoute.call(
			this,
			flight,
			fromPoint,
			[point[0], altitude, point[1]],
			options
		);
		
		route.push.apply(route, spots);
		fromPoint = spots.pop().point;
	}
	
	// Make final (back to the base) egress route
	const spots =	makeFlightRoute.call(this, flight, egressPoint);
	
	if (spots && spots.length) {
		route.push.apply(route, spots);
	}
	
	// Add fighter sweep task fly action
	flight.plan.push({
		type: planAction.FLY,
		route: route,
		visible: Boolean(flight.player)
	});
};