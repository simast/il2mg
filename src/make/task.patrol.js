/** @copyright Simas Toleikis, 2016 */
"use strict";

const Vector = require("sylvester").Vector;
const data = require("../data");
const Location = require("./locations").Location;
const makeFlightRoute = require("./flight.route");
const Item = require("../item");

// Max patrol area range (as a percent from total aircraft fuel range)
const MAX_RANGE_PERCENT = 25;

// Min/max patrol area size (in meters, between two base points)
const MIN_AREA = 30000;
const MAX_AREA = 60000;

// Min/max patrol altitude (in meters)
const MIN_ALTITUDE = 1500;
const MAX_ALTITUDE = 3500;

// Extra patrol zone padding (in meters)
// NOTE: Used to enclose patrol points when player is a flight leader
const ZONE_PADDING = 2500;

// Restricted zone around map area border (for player flight only)
const RESTRICTED_BORDER = 12500; // 12.5 Km

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
	const debugFlights = Boolean(this.debug && this.debug.flights);
	const clouds = this.weather.clouds;
	const map = this.map;
	
	// Max patrol area range based on max aircraft fuel range
	const maxPlaneRange = this.planes[flight.leader.plane].range * 1000;
	const maxPatrolRange = maxPlaneRange * (MAX_RANGE_PERCENT / 100);
	
	// Restrict patrol zone to not use areas around map border zone
	const restrictedBorder = flight.player ? RESTRICTED_BORDER : 0;
	
	// Check if point is valid (is not within restricted zone)
	const isPointValid = (point) => {
	
		if (!flight.player) {
			return true;
		}
		
		return point[0] >= restrictedBorder &&
			point[0] <= (map.height - restrictedBorder) &&
			point[1] >= restrictedBorder &&
			point[1] <= (map.width - restrictedBorder);
	};
	
	// Patrol area bounds as a rectangular location around the start point
	const patrolBounds = new Location(
		Math.max(startLocation.x - maxPatrolRange, restrictedBorder),
		Math.max(startLocation.z - maxPatrolRange, restrictedBorder),
		Math.min(startLocation.x + maxPatrolRange, map.height - restrictedBorder),
		Math.min(startLocation.z + maxPatrolRange, map.width - restrictedBorder)
	);
	
	let patrolA;
	let patrolB;
	let distanceAB;
	
	// Select base two (A and B) front points for patrol area
	const findPatrolPoints = (locations) => {
		
		if (!locations.length) {
			return;
		}
		
		let iteration = 0;
		
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
			
			iteration++;
			
			const distanceRatio = distance / maxPatrolRange;
			
			// NOTE: Chance to use this location will decrease with distance (with
			// at least 10% always guaranteed chance).
			let useLocation = Math.max(0.1, 1 - distanceRatio);
			
			// Try to choose first patrol point from locations within 50% max range
			if (!patrolA && distanceRatio > 0.5 &&
					(iteration <= locations.length / 2)) {
				
				useLocation = 0;
			}
			
			// Use location for another chance pass
			if (!rand.bool(useLocation) && locations.length) {
				
				locations.push(location);
				continue;
			}
			
			// Pick location A
			if (!patrolA) {
				patrolA = location;
			}
			// Pick location B
			else {
				
				distanceAB = patrolA.vector.distanceFrom(locationVector);
				
				// Search for a location matching min/max patrol area bounds
				if (distanceAB >= MIN_AREA && distanceAB <= MAX_AREA) {
					
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
	
	// TODO: Reject task when we can't find base two patrol reference points
	
	const patrolPoints = [];
	
	// Build base patrol area points
	for (const location of rand.shuffle([patrolA, patrolB])) {
		
		const point = [
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		];
		
		patrolPoints.push(point);
		
		// Mark base patrol area points with icons when player is a flight leader
		if (isPlayerFlightLeader && !debugFlights) {
			
			const patrolIcon = flight.group.createItem("MCU_Icon");
			
			patrolIcon.setPosition(point[0], point[1]);
			patrolIcon.setColor(mapColor.ROUTE);
			patrolIcon.Coalitions = [flight.coalition];
			patrolIcon.IconId = Item.MCU_Icon.ICON_WAYPOINT;
		}
	}
	
	// Register base two patrol reference points as flight target
	flight.target = patrolPoints.slice();
	
	// Chosen area ratio from min/max allowed size
	const areaRatio = (distanceAB - MIN_AREA) / (MAX_AREA - MIN_AREA);
	
	// NOTE: The chance to use another extra point (with 2 points in total) is
	// 100% percent up to 0.25 area size ratio, then decreasing chance from 100%
	// to 0% between 0.25 and 0.75 ratio. At 0.75 and above ratio - chance is 0%.
	// Hence, the larger the area - the less extra points will be used.
	const twoExtraPointsChance = Math.min(1, Math.max(0, 1.5 - (areaRatio * 2)));
	let numExtraPoints = 1;
	
	if (rand.bool(twoExtraPointsChance)) {
		numExtraPoints++;
	}
	
	// Generate one or two additional patrol area points
	for (let p = 0; p < numExtraPoints; p++) {
		
		const pointA = patrolPoints[p];
		const pointB = patrolPoints[(p + 1) % 2];
		
		// Distance vector between both base points (translated to 0,0 origin)
		let vectorAB = Vector.create([
			pointB[0] - pointA[0],
			pointB[1] - pointA[1]
		]);
		
		// Rotate vector to the right by random angle
		// NOTE: Using lower rotation angle the larger the patrol area
		const rotMin = Math.PI / 6;
		const rotMax = Math.max(rotMin, rotMin + Math.PI / 6 * (1 - areaRatio));
		const rotDelta = rotMax - rotMin;
		const rotAngle = rand.real(rotMin, rotMax, true);
		
		vectorAB = vectorAB.rotate(rotAngle, Vector.Zero(2));
		
		// Scale vector based on the rotation
		const scaleMin = 1 / 4; // 25%
		const scaleMax = 1 - 1 / 4; // 75%
		const scaleDelta = scaleMax - scaleMin; // 50%
		let scaleFactor = scaleMax;
		
		if (rotDelta > 0) {
			scaleFactor = scaleMin + scaleDelta * (1 - (rotAngle - rotMin) / rotDelta);
		}
		
		// Use +-10% randomness when placing additional patrol area points
		scaleFactor *= rand.real(0.9, 1.1, true);
		scaleFactor = Math.min(Math.max(scaleFactor, scaleMin), scaleMax);
		
		vectorAB = vectorAB.multiply(scaleFactor);
		
		// Build final (result) point
		const pointVector = Vector.create(pointA).add(vectorAB);
		const point = [
			Math.round(pointVector.e(1)),
			Math.round(pointVector.e(2))
		];
		
		// Validated point
		if (!isPointValid(point)) {
			
			// NOTE: One of the points (on either side) will be always valid!
			numExtraPoints = 2;
			continue;
		}
		
		patrolPoints.push(point);
	}
	
	// Sort patrol area points based on distance from patrol start
	patrolPoints.sort((a, b) => {
		
		const distanceA = startVector.distanceFrom(Vector.create(a));
		const distanceB = startVector.distanceFrom(Vector.create(b));
		
		return distanceA - distanceB;
	});
	
	// NOTE: The first (ingress) patrol point will always be the closest one and
	// the second point will be the one with "best" angle from the ingress point.
	// The rest will be shuffled (may produce intersecting pattern with 4 points).
	let ingressPoint = patrolPoints.shift();
	let ingressVector = Vector.create(ingressPoint);
	
	// Sort the rest of patrol area points based on distance from ingress point
	patrolPoints.sort((a, b) => {
		
		const distanceA = ingressVector.distanceFrom(Vector.create(a));
		const distanceB = ingressVector.distanceFrom(Vector.create(b));
		
		return distanceA - distanceB;
	});
	
	// Translate ingress vector to 0,0 origin coordinate
	ingressVector = Vector.create([
		ingressPoint[0] - startLocation.x,
		ingressPoint[1] - startLocation.z
	]);
	
	let entryPointIndex;
	let entryPointAngle;
	
	// Check next 2 nearest patrol points to find "best" (least sharp) entry point
	for (let i = 0; i < 2; i++) {
		
		// Point vector at 0,0 origin coordinate
		const entryVector = Vector.create([
			patrolPoints[i][0] - ingressPoint[0],
			patrolPoints[i][1] - ingressPoint[1]
		]);
		
		const angleDiff = ingressVector.angleFrom(entryVector);
		
		// Use entry point with smallest angle from ingress point
		if (entryPointAngle === undefined || angleDiff < entryPointAngle) {
			
			entryPointAngle = angleDiff;
			entryPointIndex = i;
		}
	}
	
	const entryPoint = patrolPoints.splice(entryPointIndex, 1)[0];
	
	rand.shuffle(patrolPoints);
	patrolPoints.unshift(ingressPoint, entryPoint);
	
	// Set patrol altitude
	let minAltitude = MIN_ALTITUDE;
	
	if (clouds.cover > 0) {
		
		minAltitude = clouds.altitude + clouds.thickness + 500;
		minAltitude = Math.max(minAltitude, MIN_ALTITUDE);
		minAltitude = Math.min(minAltitude, MAX_ALTITUDE - 500);
	}
	
	const altitude = rand.integer(minAltitude, MAX_ALTITUDE);
	
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
		// Set route waypoints to low priority (for patrol area only)
		else {
			options.priority = Item.MCU_Waypoint.PRIORITY_LOW;
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
		
		zoneIcon.setPosition(vector.e(1), vector.e(2));
		zoneIcon.setColor(mapColor.ROUTE);
		zoneIcon.Coalitions = [flight.coalition];
		zoneIcon.LineType = Item.MCU_Icon.LINE_SECTOR_2;
		
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