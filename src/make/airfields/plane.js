/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemFlags = require("./").itemFlags;
var planeSize = require("./").planeSize;

// Make airfield plane item
module.exports = function makeAirfieldPlane(airfield, item) {

	var planeSector = item[4];
	var planeTaxiRoute = item[5];
	var planeMaxSize = item[6];
	var planesBySector = airfield.planesBySector;
	
	// Build taxi spawn point by sector index (used when spawning flights)
	var taxiSpawnsBySector = airfield.taxiSpawnsBySector;
	var taxiSpawn;
	
	if (taxiSpawnsBySector) {

		if (!taxiSpawnsBySector[planeSector]) {
			taxiSpawnsBySector[planeSector] = Object.create(null);
		}
		
		if (planeTaxiRoute !== false) {
			
			if (!taxiSpawnsBySector[planeSector][planeTaxiRoute]) {
				taxiSpawnsBySector[planeSector][planeTaxiRoute] = [];
			}
			
			taxiSpawn = {
				position: [item[1], item[2]], // X/Z position
				orientation: item[3], // Orientation
				size: item[6] // Max plane size
			};
			
			taxiSpawnsBySector[planeSector][planeTaxiRoute].push(taxiSpawn);
		}
	}

	// No active planes
	if (!planesBySector || !planesBySector[planeSector] ||
			!planesBySector[planeSector][planeMaxSize]) {

		return;
	}

	var planeData = planesBySector[planeSector][planeMaxSize].shift();

	if (!planeData) {
		return;
	}

	var rand = this.rand;
	var plane = this.planesByID[planeData[0]];
	var planeItemsByUnit = airfield.planeItemsByUnit;
	var staticPlanes = rand.shuffle(plane.static || []);
	var planeStatic;
	var planeSizeID = planeSize[String(plane.size).toUpperCase()];
	var isCamo = (item[7] === itemFlags.PLANE_CAMO);

	// 75% chance to use camouflaged static plane when camo flag is set
	if (isCamo) {
		isCamo = rand.bool(0.75);
	}

	// Find static plane model
	for (var staticPlane of staticPlanes) {

		if ((staticPlane.camo && !isCamo) || (isCamo && !staticPlane.camo)) {
			continue;
		}

		planeStatic = staticPlane;
		break;
	}

	// No matching static planes found
	if (!planeStatic) {
		return;
	}

	// Create static plane item
	var itemObject = this.createItem("Block", false);

	var positionX = item[1];
	var positionZ = item[2];
	var orientation = item[3];
	var orientationOffset = 15;

	// 25% chance to slightly move plane position forward (with taxi routes only)
	if (planeTaxiRoute !== false && !planeStatic.camo && rand.bool(0.25)) {

		var positionOffsetMin = 10;
		var positionOffsetMax = 25;

		// Limit position offset for player-only taxi routes
		if (planeTaxiRoute === 0) {

			positionOffsetMin = 5;
			positionOffsetMax = 12;
		}

		var positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true);
		var orientationRad = orientation * (Math.PI / 180);

		positionX += positionOffset * Math.cos(orientationRad);
		positionZ += positionOffset * Math.sin(orientationRad);

		orientationOffset = 45;
	}

	// Slightly vary/randomize plane orientation
	orientation = orientation + rand.real(-orientationOffset, orientationOffset);
	orientation = Math.max((orientation + 360) % 360, 0);

	itemObject.Country = planeData[1];
	itemObject.Durability = 2500 + (planeSizeID * 2500);
	itemObject.Model = planeStatic.model;
	itemObject.Script = planeStatic.script;
	itemObject.setPosition(positionX, positionZ);
	itemObject.setOrientation(orientation);
	
	// Build plane item count by unit and sector index (used when spawning flights)
	var unitID = planeData[2];
	
	planeItemsByUnit[unitID] = planeItemsByUnit[unitID] || Object.create(null);
	planeItemsByUnit[unitID][planeSector] = planeItemsByUnit[unitID][planeSector] || [];
	planeItemsByUnit[unitID][planeSector].push(itemObject);
	
	// Assign static plane item object to current taxi point
	if (taxiSpawn) {
		
		taxiSpawn.group = plane.group; // Plane group ID
		taxiSpawn.item = itemObject; // Plane static item object
		
		// Weighted array of taxi spawn sector IDs by plane group (used when spawning flights)
		if (planeTaxiRoute > 0) {
			
			airfield.taxiSectorsByPlaneGroup[plane.group] = airfield.taxiSectorsByPlaneGroup[plane.group] || [];
			airfield.taxiSectorsByPlaneGroup[plane.group].push(planeSector);
		}
	}

	return [itemObject];
};