/** @copyright Simas Toleikis, 2015 */
"use strict";

const {Sylvester, Vector, Line, Plane} = require("sylvester");

// Generate mission map data
module.exports = function makeMap() {

	const options = this.items.Options;
	const map = {};

	Object.assign(map, this.battle.map);
	
	const seasonData = map.season[this.season];

	if (!seasonData) {
		throw new Error("Could not find a valid battle map!");
	}
	
	delete map.season;
	Object.assign(map, seasonData);

	// Set map data
	options.HMap = map.heightmap;
	options.Textures = map.textures;
	options.Forests = map.forests;
	options.Layers = ""; // TODO: ?
	options.GuiMap = map.gui;
	options.SeasonPrefix = map.prefix;
	
	// Set active mission map data
	this.map = map;
	
	// Check if a point/position/vector is offmap for a current mission map
	this.isOffmap = (...args) => {
		return isOffmap(map, ...args);
	};
	
	// Get map border bounds intersection data for a current mission map
	this.getMapIntersection = (...args) => {
		return getMapIntersection(map, ...args);
	};
};

// Check if a given point/position/vector is offmap
function isOffmap(map, ...args) {
	
	let posX, posZ;
	
	// Array argument
	if (Array.isArray(args[0])) {
		args = args[0];
	}
	// Vector argument
	else if (args[0] instanceof Vector) {
		args = args[0].elements;
	}
	
	// Position as three X/Y/Z arguments or a single [X,Y,Z] array argument
	if (args.length > 2) {
		[posX, , posZ] = args;
	}
	// Point as two X/Z arguments or a single [X,Z] array argument
	else if (args.length > 1) {
		[posX, posZ] = args;
	}
	else {
		throw new TypeError();
	}
	
	return (posX < 0 || posZ < 0 || posX > map.height || posZ > map.width);
}

// Get map border bounds intersection data
function getMapIntersection(map, fromVector, toVector, distance) {
	
	let borderPlanesCache = getMapIntersection.borderPlanesCache;
	
	// Initialize map border planes cache
	if (!borderPlanesCache) {
		borderPlanesCache = getMapIntersection.borderPlanesCache = new Map();
	}
	
	// Lookup cached border planes
	let borderPlanes = borderPlanesCache.get(map);
	
	if (!borderPlanes) {
		
		borderPlanes = [
			Plane.create(Vector.Zero(3), Vector.create([0, 0, 1])), // Left
			Plane.create(Vector.create([map.height, 0, 0]), Vector.create([-1, 0, 0])), // Top
			Plane.create(Vector.create([map.height, 0, map.width]), Vector.create([0, 0, -1])), // Right
			Plane.create(Vector.create([0, 0, map.width]), Vector.create([1, 0, 0])) // Bottom
		];
		
		borderPlanesCache.set(map, borderPlanes);
	}
	
	if (!distance) {
		distance = fromVector.distanceFrom(toVector);
	}
	
	const intersectLine = Line.create(fromVector, toVector.subtract(fromVector));
	
	// Test each map border plane for intersections
	for (const borderPlane of borderPlanes) {
		
		const intersectVector = borderPlane.intersectionWith(intersectLine);
		
		if (!intersectVector) {
			continue;
		}
		
		// Ignore offmap intersection points
		if (isOffmap(map, intersectVector.round())) {
			continue;
		}
		
		const distanceToIntersect = fromVector.distanceFrom(intersectVector);
		const distanceFromIntersect = intersectVector.distanceFrom(toVector);
		const distanceDelta = Math.abs(distance - (distanceToIntersect + distanceFromIntersect));
		
		// Ignore invalid intersection points
		if (distanceDelta > Sylvester.precision) {
			continue;
		}
		
		return {
			intersectVector, // Vector of intersection
			borderPlane, // Intersected border plane
			distance, // Total distance between from/to vectors
			distanceToIntersect, // Distance between "fromVector" and intersection vector
			distanceFromIntersect // Distance between intersection vector and "toVector"
		};
	}
}

module.exports.isOffmap = isOffmap;
module.exports.getMapIntersection = getMapIntersection;