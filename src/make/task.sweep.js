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

// Min/max angle and distance between two base reference points
const MIN_ANGLE = 35;
const MAX_ANGLE = 120;
const MIN_DISTANCE = 25000; // 25 km
const MAX_DISTANCE = 120000; // 120 km

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
	
	// Max fighter sweep route range based on max aircraft fuel range
	const maxPlaneRange = this.planes[flight.leader.plane].range * 1000;
	const maxSweepRange = maxPlaneRange * (MAX_RANGE_PERCENT / 100);
	
	// Find base two fighter sweep reference points
	const points = findBasePoints.call(this, flight, {
		start: startLocation,
		maxRange: Math.round(maxSweepRange / 4),
		minDistance: MIN_DISTANCE,
		maxDistance: MAX_DISTANCE,
		minAngle: MIN_ANGLE,
		maxAngle: MAX_ANGLE
	});
	
	// TODO: Reject task when we can't find base two reference points
	
	const sweepPoints = [];
	
	// Build base ingress/egress fighter sweep area points
	for (let location of rand.shuffle([points.a, points.b])) {
		
		let frontDistance;
		
		// Clone and randomize initial location point
		location = new Location(
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		);
		
		// Constants used for adjusting initial ingress/egress points
		const shiftDistance = 3000; // 3 km
		const minFrontDistance = 1000; // 1 km
		const minStartDistance = 9000; // 9 km
		
		// TODO: Use forward direction instead of shifting backwards?
		
		// Shift point closer to the starting position (over friendly territory)
		// NOTE: Also make sure adjusted point is some distance away from front
		while (getTerritory(location.x, location.z) !== flight.coalition ||
					(frontDistance !== undefined && frontDistance < minFrontDistance)) {
			
			let pointVector = Vector.create([
				location.x - startX,
				location.z - startZ 
			]);
			
			const distance = pointVector.modulus();
			
			// Don't shift base points too close to the starting location
			if (distance < minStartDistance) {
				break;
			}
			
			const locationVector = location.vector;
			const nearestFront = territories[territory.FRONT].findNear(location, 1);
			
			if (nearestFront.length) {
				frontDistance = locationVector.distanceFrom(nearestFront[0].vector);
			}
			
			// Move point closer to the starting location
			pointVector = locationVector.add(
				pointVector.x(-1).toUnitVector().x(shiftDistance)
			);
			
			location = new Location(pointVector.e(1), pointVector.e(2));
		}
		
		sweepPoints.push([location.x, location.z]);
	}
	
	for (const point of sweepPoints) {
		
		const sweepIcon = flight.group.createItem("MCU_Icon");
		
		sweepIcon.setPosition(point[0], point[1]);
		sweepIcon.setColor(mapColor.ROUTE);
		sweepIcon.Coalitions = [flight.coalition];
		sweepIcon.IconId = Item.MCU_Icon.ICON_WAYPOINT;
	}
};