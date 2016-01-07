/** @copyright Simas Toleikis, 2016 */
"use strict";

const rbush = require("rbush");
const knn = require("rbush-knn");

// Generate mission locations
module.exports = function makeLocations() {
	
	this.locations = Object.create(null);
	
	// TODO: Load static map locations (places, rivers) from data files
};

// Location data entry
class Location {

	// NOTE: All location entries are rectangles described with x1/z1 and x2/z2
	// bounding box corner coordinate points. A simple point location entry will
	// have both bounding box corner points set to the same value.
	constructor(x1, z1, x2, z2) {
		
		// Simple location point entry as X/Z position
		if (arguments.length === 2) {
			
			x2 = x1;
			z2 = z1;
		}
		// Invalid location position
		else if (arguments.length !== 4) {
			throw new TypeError("Invalid location position value.");
		}
		
		// Define location position as two x1/z1 and x2/z2 bounding box corner points
		this.x1 = x1;
		this.z1 = z1;
		this.x2 = x2;
		this.z2 = z2;
	}
	
	// Helper getters and setters for simple location point entries
	// NOTE: X/Z getters return the center point of location entry bounding box
	get x() { return (this.x1 + this.x2) / 2; }
	get z() { return (this.z1 + this.z2) / 2; }
	set x(x) { this.x1 = this.x2 = x; }
	set z(z) { this.z1 = this.z2 = z; }
}

// Location index (based on an optimized R-tree data structure)
Location.Index = class {
	
	constructor(locations) {
		
		// TODO: Figure out best value for the optional rbush(maxEntries) parameter
		this.tree = rbush(9, [".x1", ".z1", ".x2", ".z2"]);
		
		if (locations) {
			this.load(locations);
		}
	}
	
	// Clear all location data entries
	clear() {
		this.tree.clear();
	}
	
	// Bulk-load location data entries
	load(locations) {
		this.tree.load(locations);
	}
	
	// Add new location data entry
	add(location) {
		this.tree.insert(location);
	}
	
	// Remove existing location data entry
	remove(location) {
		this.tree.remove(location);
	}
	
	// Find all indexed location data entries
	findAll() {
		return this.tree.all();
	}
	
	// Find all intersecting location data entries within the bounding location
	findIn(location) {
		return this.tree.search([location.x1, location.z1, location.x2, location.z2]);
	}
	
	// Check for any intersecting location data entries within the bounding location
	checkIn(location) {
		return this.tree.collides([location.x1, location.z1, location.x2, location.z2]);
	}
	
	// Find nearest location data entries around specified location point
	findNear(location, maxLocations) {
		return knn(this.tree, [location.x, location.z], maxLocations);
	}
};

module.exports.Location = Location;