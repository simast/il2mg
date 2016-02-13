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
module.exports = function makeBriefingLocation(target, isAir) {
	
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
					
					// Combine same place types into a single type description
					if (nextPlace instanceof Location && nextPlace.type === place.type) {
						
						placeType += "s";
						isPlaceTypeCombined = true;
					}
					
					placeName += placeType + " of ";
				}
			}
			
			placeName += place.name;
		}
		// Use map grid reference as a place name
		else {
			
			// NOTE: Map grid is not based on normal X/Z left/bottom coordinate space
			const gridMaxZ = 1 + Math.floor(this.map.width / GRID_SIZE);
			const gridX = Math.floor((this.map.height - place[0]) / GRID_SIZE);
			const gridZ = Math.floor(place[1] / GRID_SIZE);
			const grid = (gridX * gridMaxZ) + 1 + gridZ;
			
			// TODO: Use sub-grid reference points!
			
			placeName = "grid " + grid;
		}
		
		placeNames.push(placeName);
	});
	
	briefing.push(placeNames.join(" and "));
	
	return briefing.join(" ");
};