/** @copyright Simas Toleikis, 2016 */
"use strict";

const Vector = require("sylvester").Vector;
const data = require("../data");
const Location = require("./locations").Location;

// Briefing map grid size
const GRID_SIZE = 10000; // 10 km

// Place selection max radius
const PLACE_RADIUS = 5000; // 5 Km

// Data constants
const location = data.location;

// Make briefing location description
module.exports = function makeBriefingLocation(target) {
	
	if (!Array.isArray(target) || !target.length) {
		return;
	}
	
	// Can only make location description for max two target points
	if (target.length > 2) {
		target = target.slice(0, 2);
	}
	
	const places = this.locations.places;
	const targetPlaces = [];
	
	// Process each location target point
	target.forEach((point, index) => {
		
		targetPlaces[index] = point;
		
		// Find all interesting places around the target point
		let foundPlaces = places.findIn(new Location(
			point[0] - PLACE_RADIUS,
			point[1] - PLACE_RADIUS,
			point[0] + PLACE_RADIUS,
			point[1] + PLACE_RADIUS
		));
		
		if (!foundPlaces.length) {
			return;
		}
		
		const targetVector = Vector.create(point);
		
		// Filter out places outside max place radius and/or with bad names
		foundPlaces = foundPlaces.filter((place) => {
			
			// Place has to have a valid name (without digits and other punctuation)
			if (!place.name || /[^A-Za-z\s\-]/.test(place.name)) {
				return false;
			}
			
			return (targetVector.distanceFrom(place.vector) <= PLACE_RADIUS);
		});
		
		if (foundPlaces.length) {
		
			// Sort found places based on the distance from target point
			foundPlaces.sort((a, b) => {
				
				const distanceA = targetVector.distanceFrom(a.vector);
				const distanceB = targetVector.distanceFrom(b.vector);
				
				return distanceA - distanceB;
			});
			
			// Use closest found place
			targetPlaces[index] = foundPlaces[0];
		}
	});
	
	const briefing = [];
	
	// Target place as two locations
	if (targetPlaces.length > 1) {
		briefing.push("between");
	}
	// TODO: Target place as a single location
	else {
		briefing.push("over");
	}
	
	const placeNames = [];
	let isPlaceTypeCombined = false;
	
	targetPlaces.forEach((place, placeIndex) => {
		
		let placeName = "";
		
		// Use location name
		if (place instanceof Location) {
			
			// TODO: Add direction when location is a single target point
			
			if (!isPlaceTypeCombined) {
				
				const nextPlace = targetPlaces[placeIndex + 1];
				let placeType;
				
				if (place.type === location.VILLAGE) {
					placeType = "village";
				}
				else if (place.type === location.TOWN) {
					placeType = "town";
				}
				else if (place.type === location.CITY) {
					placeType = "city";
				}
				
				if (placeType) {
					
					// Combine same village/town place types into a single type description
					if (nextPlace instanceof Location && nextPlace.type === place.type &&
							[location.VILLAGE, location.TOWN].indexOf(place.type) >= 0) {
						
						placeType += "s";
						isPlaceTypeCombined = true;
					}
					
					if (!nextPlace) {
						placeName += "the ";
					}
					
					placeName += placeType + " of ";
				}
			}
			
			placeName += place.name;
		}
		// Use map grid reference as a place name
		else {
			
			// Map grid is not based on normal X/Z left/bottom coordinate space
			const gridMaxZ = 1 + Math.floor(this.map.width / GRID_SIZE);
			const gridX = (this.map.height - place[0]) / GRID_SIZE;
			const gridZ = place[1] / GRID_SIZE;
			const grid = Math.floor(gridX) * gridMaxZ + 1 + Math.floor(gridZ);
			
			// Each grid is sub-divided into 9 smaller sub-grids
			const subgridSize = Math.sqrt(9);
			const subgridX = (1 - gridX % 1) * subgridSize;
			const subgridZ = (gridZ % 1) * subgridSize;
			const subgrid = Math.floor(subgridX) * subgridSize + 1 + Math.floor(subgridZ);
			
			placeName = "grid " + ("000" + grid).substr(-3, 3);
			
			// NOTE: Subgrid number 5 is not visible on the map
			if (subgrid !== 5) {
				placeName += ":" + subgrid;
			}
		}
		
		placeNames.push(placeName);
	});
	
	briefing.push(placeNames.join(" and "));
	
	return briefing.join(" ");
};