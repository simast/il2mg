import path from "path"
import rbush from "rbush"
import knn from "rbush-knn"
import sylvester from "sylvester"
import data from "../data"
import log from "../log"

// Location item types
export const LocationType = Object.freeze({
	Village: 1, // Small village
	Town: 2, // Medium town
	City: 3, // Large city
	Airfield: 4 // Airfield
})

// Generate mission locations
export default function makeLocations() {

	// Locations database
	this.locations = Object.create(null)

	// Total locations count
	let totalLocations = 0

	// Total unique locations counts for set of types
	const totalLocationsByType = {
		villages: new Set(),
		towns: new Set(),
		cities: new Set()
	}

	// Load static map locations (places, rivers) from data files
	this.battle.locations.forEach(locationsFile => {

		const locationsData = data.load(path.join(this.battlePath, "locations", locationsFile))
		const locationsList = []

		// Build locations index per each locations file
		this.locations[locationsFile] = new Location.Index()

		// Process all locations
		for (const locationData of locationsData) {

			const x = locationData[1]
			const y = locationData[2]
			const z = locationData[3]

			const x1 = x - locationData[6] // x - backward
			const z1 = z - locationData[7] // z - left
			const x2 = x + locationData[4] // x + forward
			const z2 = z + locationData[5] // z + right

			const location = new Location(x1, z1, x2, z2)

			// Location type
			const locationType = location.type = locationData[0]

			// Origin position/point
			location.origin = {x, y, z}

			// Optional location name
			const name = locationData[8]

			if (name) {
				location.name = name
			}

			locationsList.push(location)

			// Track total location counts
			totalLocations++

			// Track unique location type counts
			if (name) {

				let totalLocationType

				if (locationType === LocationType.Village) {
					totalLocationType = "villages"
				}
				else if (locationType === LocationType.Town) {
					totalLocationType = "towns"
				}
				else if (locationType === LocationType.City) {
					totalLocationType = "cities"
				}

				if (totalLocationType) {
					totalLocationsByType[totalLocationType].add(name)
				}
			}
		}

		// Load all locations to a location index
		this.locations[locationsFile].load(locationsList)
	})

	// Log mission locations info
	for (const type in totalLocationsByType) {
		totalLocationsByType[type] = totalLocationsByType[type].size
	}

	log.I("Locations:", totalLocations, totalLocationsByType)
}

// Location data entry
export class Location {

	// NOTE: All location entries are rectangles described with x1/z1 and x2/z2
	// bounding box corner coordinate points. A simple point location entry will
	// have both bounding box corner points set to the same value.
	constructor(x1, z1, x2, z2) {

		// Simple location point entry as X/Z position
		if (arguments.length === 2) {

			x2 = x1
			z2 = z1
		}
		// Invalid location position
		else if (arguments.length !== 4) {
			throw new TypeError("Invalid location position value.")
		}

		// Define location position as two x1/z1 and x2/z2 bounding box corner points
		this.x1 = x1
		this.z1 = z1
		this.x2 = x2
		this.z2 = z2
	}

	// Helper getters and setters for simple location point entries
	// NOTE: X/Z getters return the center point of location entry bounding box
	get x() { return (this.x1 + this.x2) / 2 }
	get z() { return (this.z1 + this.z2) / 2 }
	set x(x) { this.x1 = this.x2 = x }
	set z(z) { this.z1 = this.z2 = z }

	// Get location as a 2D vector object
	get vector() {
		return sylvester.Vector.create([this.x, this.z])
	}
}

// Location index (based on an optimized R-tree data structure)
Location.Index = class {

	constructor(locations) {

		// TODO: Figure out best value for the optional rbush(maxEntries) parameter
		this.tree = rbush(9, [".x1", ".z1", ".x2", ".z2"])

		if (locations) {
			this.load(locations)
		}
	}

	// Clear all location data entries
	clear() {
		this.tree.clear()
	}

	// Bulk-load location data entries
	load(locations) {
		this.tree.load(locations)
	}

	// Add new location data entry
	add(location) {
		this.tree.insert(location)
	}

	// Remove existing location data entry
	remove(location) {
		this.tree.remove(location)
	}

	// Find all indexed location data entries
	findAll() {
		return this.tree.all()
	}

	// Find all intersecting location data entries within the bounding location
	findIn(location) {

		return this.tree.search({
			minX: location.x1,
			minY: location.z1,
			maxX: location.x2,
			maxY: location.z2
		})
	}

	// Check for any intersecting location data entries within the bounding location
	checkIn(location) {

		return this.tree.collides({
			minX: location.x1,
			minY: location.z1,
			maxX: location.x2,
			maxY: location.z2
		})
	}

	// Find nearest location data entries around specified location point
	findNear(location, maxLocations) {
		return knn(this.tree, location.x, location.z, maxLocations)
	}
}