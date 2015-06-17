/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;

// Data constants
var planeSize = DATA.planeSize;
var itemFlag = DATA.itemFlag;
var flightState = DATA.flightState;

// Make mission flight plane item objects
module.exports = function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set weapon mods

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var usedParkSpawns = [];
	var planeNumber = flight.planes;

	// Process each flight element (section) in reverse
	for (var elementIndex = flight.elements.length - 1; elementIndex >= 0; elementIndex--) {
		
		var element = flight.elements[elementIndex];
		var unit = element.unit;

		// Skip leader only (first plane) when mapping formation number based on distance
		var sortSkip = 0;

		// Only one element can start on the ramp from "start" flight state
		// NOTE: Player element will always start from ramp
		if (element.state === flightState.START &&
				((!flight.player && elementIndex > 0) || (flight.player && !element.player))) {

			element.state = flightState.TAXI;
		}

		// Process each plane in reverse
		for (var planeIndex = element.length - 1; planeIndex >= 0; planeIndex--) {

			var plane = element[planeIndex];
			var planeData = this.planesByID[plane.plane];
			var isPlayer = (plane === flight.player);
			var lastPlane = element[planeIndex + 1];
			var isLeader = (planeIndex === 0);
			var validParkSpawns = [];
			var foundSpawnPoint = false;
			var foundStaticPlane = false;
			var pilot = plane.pilot;
			var planeItem = plane.item = flight.group.createItem("Plane");
			var positionX;
			var positionY;
			var positionZ;
			var orientation;

			// Try to start plane from parking/ramp
			if (element.state === flightState.START) {

				// Build a list of valid taxi spawn points
				if (flight.spawns) {

					var planeSizeID = planeSize[String(planeData.size).toUpperCase()];

					flight.spawns.forEach(function(spawnPoint, spawnIndex) {

						var spawnID = spawnIndex + 1;

						if (usedParkSpawns.indexOf(spawnID) === -1 && spawnPoint.size >= planeSizeID) {

							var distance = 0;

							// Compute spawn point distance to last plane item position
							if (flight.elements.length > 1 && lastPlane) {

								var posXDiff = lastPlane.item.XPos - spawnPoint.position[0];
								var posZDiff = lastPlane.item.ZPos - spawnPoint.position[2];

								distance = Math.sqrt(Math.pow(posXDiff, 2) + Math.pow(posZDiff, 2));
							}

							validParkSpawns.push({
								id: spawnID,
								point: spawnPoint,
								distance: distance
							});
						}
					});

					// Sort valid spawn points based on the distance to the last plane in a
					// multi element formation. This helps when placing multiple elements on
					// the same ramp as they will be grouped together and the flight formation
					// will not be mixed up.
					if (flight.elements.length > 1 && lastPlane) {

						validParkSpawns.sort(function(a, b) {
							return (a.distance - b.distance);
						});
					}
					// When placing a first plane on the ramp - sort valid spawn points by
					// size (the first plane will use best fit spawn point).
					else {

						validParkSpawns.sort(function(a, b) {
							return (a.point.size - b.point.size);
						});
					}
				}

				// Try to use any of the valid parking spawn points
				var parkSpawn = validParkSpawns.shift();

				// Use ramp/parking spawn point
				if (parkSpawn) {

					var spawnPoint = parkSpawn.point;
					var positionOffsetMin = 10;
					var positionOffsetMax = 20;
					var orientationOffset = 15;

					// Limit position offset for player-only taxi routes
					if (flight.taxi === 0) {

						positionOffsetMin = 5;
						positionOffsetMax = 12;
					}
					// Slightly move leader plane position forward to avoid possible AI taxiing issues
					else if (isLeader) {

						positionOffsetMin += 10;
						positionOffsetMax += 10;
					}

					positionX = spawnPoint.position[0];
					positionY = spawnPoint.position[1];
					positionZ = spawnPoint.position[2];
					orientation = spawnPoint.orientation;

					// Slightly move plane position forward
					var positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true);
					var orientationRad = orientation * (Math.PI / 180);

					positionX += positionOffset * Math.cos(orientationRad);
					positionZ += positionOffset * Math.sin(orientationRad);

					// Slightly vary/randomize plane orientation
					orientation = orientation + rand.real(-orientationOffset, orientationOffset);
					orientation = Math.max((orientation + 360) % 360, 0);

					// TODO: Move around existing static plane items instead of removing them
					if (spawnPoint.plane && spawnPoint.plane.item) {

						spawnPoint.plane.item.remove();
						foundStaticPlane = true;

						delete spawnPoint.plane.item;
						delete spawnPoint.plane;
					}

					// Set plane item parking start position and orientation
					planeItem.setPosition(positionX, positionY, positionZ);
					planeItem.setOrientation(orientation);

					// Mark parking spawn point as used/reserved
					usedParkSpawns.push(parkSpawn.id);
					foundSpawnPoint = true;
				}
			}
			// Try to start plane from runway
			else if (element.state === flightState.RUNWAY) {

			}

			// Use taxi spawn point
			if (!foundSpawnPoint && flight.taxi &&
					(element.state === flightState.START || element.state === flightState.TAXI)) {
				
				var taxiData = airfield.taxi[flight.taxi];
				var taxiPoints = taxiData[4];
				var taxiPointID = 0;

				// Find the last used taxi spawn point ID
				if (usedParkSpawns.length) {
					
					for (var x = usedParkSpawns.length - 1; x >= 0; x--) {

						if (usedParkSpawns[x] < 0) {

							taxiPointID = Math.abs(usedParkSpawns[x]);
							break;
						}
					}
				}
				
				var taxiPoint = taxiPoints[taxiPointID];
				var nextTaxiPoint = taxiPoints[taxiPointID + 1];
				
				if (taxiPoint && taxiPoint[2] !== itemFlag.TAXI_RUNWAY) {
					
					positionX = taxiPoint[0];
					positionY = airfield.position[1];
					positionZ = taxiPoint[1];

					// Set plane item taxi start position and orientation
					planeItem.setPosition(positionX, positionY, positionZ);
					planeItem.setOrientationTo(nextTaxiPoint[0], nextTaxiPoint[1]);

					// Slightly move plane position backwards (from taxi spawn point)
					var taxiOffsetOrientRad = planeItem.YOri * (Math.PI / 180);
					var taxiOffset = 5; // 5 meters backwards

					positionX -= taxiOffset * Math.cos(taxiOffsetOrientRad);
					positionZ -= taxiOffset * Math.sin(taxiOffsetOrientRad);

					planeItem.setPosition(positionX, positionY, positionZ);
				
					// Mark taxi spawn point as used/reserved
					usedParkSpawns.push(-(taxiPointID + 1));
					foundSpawnPoint = true;
					
					// Set element state to "taxi"
					element.state = flightState.TAXI;
					
					// Skip this plane when mapping formation number based on distance
					sortSkip++;
				}
			}
			
			// Spawn in the air above airfield
			if (!foundSpawnPoint) {
				
				// Force air start to entire element when any of the planes must be spawned
				// in the air (required for the planes in the air to not crash).
				element.state = 0;

				// Since the entire element is moved to an air start - free up previously
				// reserved parking and taxi spawn points for other flight elements.
				for (var i = (element.length - 1 - planeIndex); i > 0 && usedParkSpawns.length; i--) {
					usedParkSpawns.pop();
				}
				
				// Reset formation number sort skip number (to leader only)
				sortSkip = 0;
			}
			
			// Replace matching unit static plane item with a live plane
			// TODO: Handle shedulled flights
			if (!foundStaticPlane && flight.sector && airfield.planeItemsByUnit[unit.id]) {

				var planeItemsByUnit = airfield.planeItemsByUnit[unit.id][flight.sector];
				
				// FIXME: flight.sector can be other sector (not where unit planes are present)
				if (planeItemsByUnit) {
					
					for (var staticPlane of planeItemsByUnit) {

						// Select matching (by plane group) static plane item
						if (staticPlane.item && staticPlane.group === planeData.group) {

							staticPlane.item.remove();
							delete staticPlane.item;

							break;
						}
					}
				}
			}
			
			// Set plane name as pilot ID for player flight planes only
			// NOTE: Required for the radio message UI to not report distant plane/pilot IDs
			if (flight.player && !isPlayer && pilot.id) {
				planeItem.setName(pilot.id);
			}

			planeItem.Script = planeData.script;
			planeItem.Model = planeData.model;
			planeItem.Country = unit.country;
			planeItem.Callsign = flight.callsign[0];

			// Player plane item
			if (plane === flight.player) {
				planeItem.AILevel = Plane.AI_PLAYER;
			}
			// AI plane item
			else {
				planeItem.AILevel = pilot.level;
			}

			// Set plane skin
			if (planeData.skins && planeData.skins[unit.country]) {
				
				var skins = planeData.skins[unit.country];
				var skin = null;

				// Use player-only skin
				if (isPlayer && skins.player) {
					skin = rand.pick(skins.player);
				}
				// Select a random skin from valid/weighted skin list
				else {
					skin = rand.pick(skins);
				}
				
				// Set custom plane skin
				if (skin && skin.length) {
					planeItem.Skin = skin;
				}
			}
	
			// Create plane entity
			planeItem.createEntity();
		}
		
		// Sort subordinate planes in an element formation based on the distance
		// to the leader plane (will avoid air collisions and taxi issues).
		if (element.length > 2) {

			// Sort reference plane (either element leader or the last on the taxi way)
			var sortPlane;
			
			// Skip only leader when sorting
			if (sortSkip === 0) {
				sortSkip = 1;
			}

			element.forEach(function(plane, planeIndex) {

				plane.distance = (planeIndex - sortSkip);
				
				// Ignore leader plane and planes on the taxi way
				if (plane.distance < 0) {
					sortPlane = plane;
				}
				// Compute plane distance to sort reference plane
				else {

					var posXDiff = sortPlane.item.XPos - plane.item.XPos;
					var posZDiff = sortPlane.item.ZPos - plane.item.ZPos;

					plane.distance = Math.sqrt(Math.pow(posXDiff, 2) + Math.pow(posZDiff, 2));
				}
			});

			element.sort(function(a, b) {
				return (a.distance - b.distance);
			});
		}

		(function() {
			
			for (var planeIndex = element.length - 1; planeIndex >= 0; planeIndex--) {

				var plane = element[planeIndex];
				var planeItem = plane.item;
				var leaderPlane = element[0];
				var isPlayer = (plane === flight.player);
				var isLeader = (plane === leaderPlane);

				// Group subordinate planes with element leader
				if (element.length > 1 && planeIndex > 0) {
					planeItem.entity.addTarget(leaderPlane.item.entity);
				}

				// Set plane number and formation index
				if (flight.planes > 1) {
					
					planeItem.NumberInFormation = planeIndex;
					planeItem.Callnum = planeNumber;
					plane.number = planeNumber;

					planeNumber--;
				}
				
				// Parking start, engine not running
				if (element.state === flightState.START) {
					
					planeItem.StartInAir = Plane.START_PARKING;
					
					// 50% chance to start with engine running for non-leader and non-player planes
					if (!isPlayer && !isLeader && rand.bool(0.5)) {
						planeItem.StartInAir = Plane.START_RUNWAY;
					}
				}
				// Ready, taxi or runway start with engine running
				else if (typeof element.state === "string") {
					planeItem.StartInAir = Plane.START_RUNWAY;
				}
				// Air start
				else {
					planeItem.StartInAir = Plane.START_AIR;
				}
			}
		})();
	}

	delete flight.spawns;
};