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
const MIN_ANGLE = 35;
const MAX_ANGLE = 120;

// Min/max distance between two base reference points (in meters)
const MIN_DISTANCE = 25000;
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
		
		let shiftVector;
		
		// Clone and randomize initial location point
		location = new Location(
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		);
		
		if (getTerritory(location.x, location.z) === territory.FRONT) {
			
			shiftVector = Vector.create([
				location.x - startX,
				location.z - startZ
			]).toUnitVector();
			
			location = startLocation;
		}
		
		// Constants used for shifting initial ingress/egress points
		const shiftDistance = 3000; // 3 km
		const minFrontDistance = 3000; // 3 km
		
		// Find nearest front line following shift vector (from starting location)
		while (shiftVector) {
			
			const locationVector = location.vector;
			const nearestFront = territories[territory.FRONT].findNear(location, 1);
			
			// Make sure base entry/exit point is some distance away from front lines
			if (nearestFront.length &&
				locationVector.distanceFrom(nearestFront[0].vector) < minFrontDistance) {
				
				break;
			}
			
			const pointVector = locationVector.add(shiftVector.x(shiftDistance));
			const posX = pointVector.e(1);
			const posZ = pointVector.e(2);
			
			// End shift when we reach front lines
			if (getTerritory(posX, posZ) !== flight.coalition) {
				break;
			}
			
			location = new Location(posX, posZ);
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