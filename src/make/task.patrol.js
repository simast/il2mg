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
	const startX = airfield.position[0];
	const startZ = airfield.position[2];
	const startLocation = new Location(startX, startZ);
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
		Math.max(startX - maxPatrolRange, restrictedBorder),
		Math.max(startZ - maxPatrolRange, restrictedBorder),
		Math.min(startX + maxPatrolRange, map.height - restrictedBorder),
		Math.min(startZ + maxPatrolRange, map.width - restrictedBorder)
	);
	
	let patrolA;
	let patrolB;
	let distanceAB;
	
	// Select base two (A and B) front points for patrol area
	const findPatrolPoints = (locations, directions) => {
		
		if (!locations.length) {
			return;
		}
		
		let iteration = 0;
		
		// Make sure location selection is randomized
		rand.shuffle(locations);
		
		do {
			
			const location = locations.shift();
			let directionChance;
			
			// Filter out locations based on forbidden directions
			if (directions) {
				
				directionChance = directions[getDirection(location)];
				
				// Direction is forbidden
				if (directionChance <= 0) {
					continue;
				}
			}
			
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
			if (!patrolA && distanceRatio > 0.5 && (iteration <= locations.length / 2)) {
				useLocation = 0;
			}
			// Use location based on provided direction weight/chance
			else if (directions && !rand.bool(directionChance)) {
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
	
	// Get direction value for location (in relation to origin position)
	const getDirection = (location) => {
		
		const locationX = location.x;
		const locationZ = location.z;
		
		if (locationX > startX && locationZ > startZ) {
			return "tr";
		}
		else if (locationX < startX && locationZ > startZ) {
			return "br";
		}
		else if (locationX < startX && locationZ < startZ) {
			return "bl";
		}
		else {
			return "tl";
		}
	};
	
	// Adjust (align and face) bounds based on a list of "hot" points
	const alignBoundsToPoints = (bounds, points) => {
		
		// Four "corners" of the bounds area
		let tl = 0;
		let tr = 0;
		let bl = 0;
		let br = 0;
		
		// Mark availability (and popularity) of each corner
		for (const point of points) {
			
			const pointX = point[0];
			const pointZ = point[1];
			
			if (pointX > startX) {
				tl++; tr++; bl--; br--;
			}
			else if (pointX < startX) {
				tl--; tr--; bl++; br++;
			}
			
			if (pointZ > startZ) {
				tl--; tr++; bl--; br++;
			}
			else if (pointZ < startZ) {
				tl++; tr--; bl++; br--;
			}
		}
		
		const directions = {tl, tr, bl, br};
		let maxWeight = 0;
		
		// Compute max direction weight value
		for (const direction in directions) {
			
			const weight = directions[direction];
			
			if (weight >= 0) {
				maxWeight += (weight + 1);
			}
		}
		
		// Compute direction chance values
		for (const direction in directions) {
			
			const weight = directions[direction];
			
			if (weight < 0) {
				directions[direction] = 0;
			}
			else {
				directions[direction] = (weight + 1) / maxWeight;
			}
		}
		
		// Resize bounds area to only include available (positive) corners
		
		if (tl < 0 && tr < 0) {
			bounds.x2 = startX;
		}
		
		if (tr < 0 && br < 0) {
			bounds.z2 = startZ;
		}
		
		if (br < 0 && bl < 0) {
			bounds.x1 = startX;
		}
		
		if (bl < 0 && tl < 0) {
			bounds.z1 = startZ;
		}
		
		return directions;
	};
	
	// Option 1: Find patrol points from fronts within max patrol range
	findPatrolPoints(territories[territory.FRONT].findIn(patrolBounds));
	
	// Option 2: Find patrol points on friendly territory within max patrol range
	if (!patrolA || !patrolB) {
		
		const enemyCoalition = this.getEnemyCoalition(flight.coalition);
		const enemyOffmapSpots = this.offmapSpotsByCoalition[enemyCoalition];
		let directions;
		
		// Adjust patrol bounds to align with and face any enemy offmap spots
		// NOTE: This is done so that flights will not go on patrol in a completely
		// different direction to where the enemy is.
		if (enemyOffmapSpots) {
			directions = alignBoundsToPoints(patrolBounds, enemyOffmapSpots);
		}
		
		if (patrolA) {
			
			// If we can't find both patrol area points based on front lines (when
			// front lines are either very small in size or too far away) - there is
			// a 50% chance to select both patrol area points on friendly territory.
			if (rand.bool(0.5)) {
				patrolA = null;
			}
			// Validate patrolA location to not be from forbidden direction
			else {
				
				const direction = getDirection(patrolA);
				
				// Direction is forbidden
				if (directions[direction] <= 0) {
					patrolA = null;
				}
			}
		}
		
		findPatrolPoints(
			territories[flight.coalition].findIn(patrolBounds),
			directions
		);
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
	const ingressDistance = ingressVector.distanceFrom(startVector);
	
	// Sort the rest of patrol area points based on distance from ingress point
	patrolPoints.sort((a, b) => {
		
		const distanceA = ingressVector.distanceFrom(Vector.create(a));
		const distanceB = ingressVector.distanceFrom(Vector.create(b));
		
		return distanceA - distanceB;
	});
	
	// Translate ingress vector to 0,0 origin coordinate
	ingressVector = Vector.create([
		ingressPoint[0] - startX,
		ingressPoint[1] - startZ
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
	
	// Set patrol loop pattern fly time
	let patrolTimeMin;
	let patrolTimeMax;
	
	patrolTimeMax = (maxPlaneRange - (ingressDistance * 2)) / 1000;
	patrolTimeMax = patrolTimeMax / flight.speed * 60 * 0.75;
	patrolTimeMin = patrolTimeMax * 0.5;
	
	// Use shorter patrol time with player flight
	if (flight.player) {
		
		patrolTimeMin = Math.min(patrolTimeMin, 15);
		patrolTimeMax = Math.min(patrolTimeMin * 2, patrolTimeMax);
	}
	
	const patrolTime = rand.real(patrolTimeMin, patrolTimeMax);
	
	// Add loop pattern route marker (back to ingress point)
	route.push([loopSpotIndex, Math.round(60 * patrolTime)]);
	
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