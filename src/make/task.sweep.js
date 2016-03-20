/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");
const Location = require("./locations").Location;
const Item = require("../item");
const findBasePoints = require("./task.patrol").findBasePoints;
const getTerritory = require("./fronts").getTerritory;

// Flight make parts
const makeFlightAltitude = require("./flight.altitude");
const makeFlightRoute = require("./flight.route");

// Min/max angle and distance between two base reference points
const MIN_ANGLE = 45;
const MAX_ANGLE = 120;
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
	
	// Find base two fighter sweep reference points
	const points = findBasePoints.call(this, flight, {
		start: startLocation,
		maxRange: 200000, // TODO
		maxDistance: MAX_DISTANCE,
		minAngle: MIN_ANGLE,
		maxAngle: MAX_ANGLE
	});
	
	// TODO: Reject task when we can't find base two reference points
	
	const sweepPoints = [];
	
	// Build base fighter sweep area points
	for (const location of [points.a, points.b]) {
		
		const point = [
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		];
		
		sweepPoints.push(point);
	}
	
	for (const point of sweepPoints) {
		
		const sweepIcon = flight.group.createItem("MCU_Icon");
		
		sweepIcon.setPosition(point[0], point[1]);
		sweepIcon.setColor(mapColor.ROUTE);
		sweepIcon.Coalitions = [flight.coalition];
		sweepIcon.IconId = Item.MCU_Icon.ICON_WAYPOINT;
	}
};