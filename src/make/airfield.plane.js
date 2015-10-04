/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemFlag = DATA.itemFlag;
var planeSize = DATA.planeSize;

// Make airfield plane item
module.exports = function makeAirfieldPlane(airfield, item) {

	var sector = item[5];
	var taxiRoute = item[6];
	var maxSize = item[7];
	var taxiOffset;
	var planesBySector = airfield.planesBySector;
	var playerTaxiRoute;
	
	// Extended taxi route data as array
	if (Array.isArray(taxiRoute)) {
		
		taxiOffset = taxiRoute[1]; // Spawn offset in meters
		taxiRoute = taxiRoute[0];
	}

	// NOTE: Negative taxi routes are player-only taxi routes
	if (taxiRoute < 0) {

		playerTaxiRoute = Math.abs(taxiRoute);
		taxiRoute = 0;
	}
	
	// Build taxi spawn point by sector index (used when spawning flights)
	var taxiSpawnsBySector = airfield.taxiSpawnsBySector;
	var taxiSpawn;
	
	if (taxiSpawnsBySector) {

		if (!taxiSpawnsBySector[sector]) {
			taxiSpawnsBySector[sector] = Object.create(null);
		}

		if (taxiRoute !== false) {

			if (!taxiSpawnsBySector[sector][taxiRoute]) {
				taxiSpawnsBySector[sector][taxiRoute] = [];
			}

			taxiSpawn = {
				position: item.slice(1, 4), // X/Y/Z position
				orientation: item[4], // Orientation
				size: maxSize // Max plane size
			};
			
			// Mark route to be activated for this plane spawn
			if (playerTaxiRoute) {
				taxiSpawn.route = playerTaxiRoute;
			}
			else if (taxiRoute > 0) {
				taxiSpawn.route = taxiRoute;
			}
			
			// Include taxi spawn offset
			if (taxiOffset) {
				taxiSpawn.offset = taxiOffset;
			}
			
			taxiSpawnsBySector[sector][taxiRoute].push(taxiSpawn);
		}
	}

	// No active planes
	if (!planesBySector || !planesBySector[sector] ||
			!planesBySector[sector][maxSize]) {

		return;
	}

	var planeData = planesBySector[sector][maxSize].shift();

	if (!planeData) {
		return;
	}

	var rand = this.rand;
	var plane = this.planes[planeData[0]];
	var planeItemsByUnit = airfield.planeItemsByUnit;
	var staticPlanes = rand.shuffle(plane.static || []);
	var planeStatic;
	var planeSizeID = planeSize[String(plane.size).toUpperCase()];
	var isCamo = (item[8] === itemFlag.PLANE_CAMO);

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
	var planeItem = this.createItem("Block", false);
	
	var positionX = item[1];
	var positionY = item[2];
	var positionZ = item[3];
	var orientation = item[4];
	var orientationOffset = 15;

	// 25% chance to slightly move plane position forward (with taxi routes only)
	if (taxiRoute !== false && !planeStatic.camo && rand.bool(0.25)) {

		var positionOffsetMin = 10;
		var positionOffsetMax = 20;

		// Limit position offset for player-only taxi routes
		if (taxiRoute === 0) {

			positionOffsetMin = 5;
			positionOffsetMax = 12;
		}

		var positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true);
		var orientationRad = orientation * (Math.PI / 180);

		positionX += positionOffset * Math.cos(orientationRad);
		positionZ += positionOffset * Math.sin(orientationRad);

		orientationOffset = 40;
	}

	// Slightly vary/randomize plane orientation
	orientation = orientation + rand.real(-orientationOffset, orientationOffset);
	orientation = Math.max((orientation + 360) % 360, 0);

	planeItem.Country = planeData[1];
	planeItem.Durability = 500 + (planeSizeID * 1000);
	planeItem.Model = planeStatic.model;
	planeItem.Script = planeStatic.script;
	planeItem.setPosition(positionX, positionY, positionZ);
	planeItem.setOrientation(orientation);
	
	var unitID = planeData[2];
	var planeIndexData = {
		group: plane.group, // Plane group ID
		item: planeItem // Plane static item object
	};

	// Build plane item count by unit and sector index (used when spawning flights)
	planeItemsByUnit[unitID] = planeItemsByUnit[unitID] || Object.create(null);
	planeItemsByUnit[unitID][sector] = planeItemsByUnit[unitID][sector] || [];
	planeItemsByUnit[unitID][sector].push(planeIndexData);
	
	// Assign static plane item object to current taxi point
	if (taxiSpawn) {
		
		taxiSpawn.plane = planeIndexData;
		
		// Weighted array of taxi spawn sector IDs by plane group (used when spawning flights)
		if (taxiRoute > 0) {
			
			airfield.taxiSectorsByPlaneGroup[plane.group] = airfield.taxiSectorsByPlaneGroup[plane.group] || [];
			airfield.taxiSectorsByPlaneGroup[plane.group].push(sector);
		}
	}

	return [planeItem];
};