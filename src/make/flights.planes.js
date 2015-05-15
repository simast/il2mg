/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;
var planeSize = require("./airfields").planeSize;
var itemFlag = require("./airfields").itemFlag;
var flightState = require("./flights.flight").flightState;

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

		// Only the first element can start without engines running
		if (element.state === flightState.START && elementIndex > 0) {
			element.state = flightState.READY;
		}

		// Process each plane in reverse
		for (var planeIndex = element.length - 1; planeIndex >= 0; planeIndex--) {

			var plane = element[planeIndex];
			var planeData = this.planesByID[plane.plane];
			var isPlayer = (plane === flight.player);
			var lastPlane = element[planeIndex + 1];
			var isLeader = (planeIndex === 0);
			var validParkSpawns = [];
			var pilot = plane.pilot;

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

			var planeItem = plane.item = flight.group.createItem("Plane");
			var positionX;
			var positionY;
			var positionZ;
			var orientation;
			var foundSpawnPoint = false;

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
				if (spawnPoint.plane) {
	
					spawnPoint.plane.item.remove();
					delete spawnPoint.plane;
				}
				
				// Set plane item parking start position and orientation
				planeItem.setPosition(positionX, positionY, positionZ);
				planeItem.setOrientation(orientation);
	
				// Mark parking spawn point as used/reserved
				usedParkSpawns.push(parkSpawn.id);
				foundSpawnPoint = true;
			}
			// Use taxi spawn point
			else if (flight.taxi) {
				
				var taxiData = airfield.taxi[flight.taxi];
				var taxiPoints = taxiData[4];
				var taxiPointID = 0;
				
				// Find the last used taxi spawn point ID
				if (usedParkSpawns.length) {
					
					var lastTaxiPointID = usedParkSpawns[usedParkSpawns.length - 1];
					
					if (lastTaxiPointID < 0) {
						taxiPointID = Math.abs(lastTaxiPointID);
					}
				}
				
				var taxiPoint = taxiPoints[taxiPointID];
				var nextTaxiPoint = taxiPoints[taxiPointID + 1];
				
				if (taxiPoint && taxiPoint[2] !== itemFlag.TAXI_RUNWAY) {
					
					// Set plane item taxi start position and orientation
					planeItem.setPosition(taxiPoint[0], airfield.position[1], taxiPoint[1]);
					planeItem.setOrientationTo(nextTaxiPoint[0], nextTaxiPoint[1]);
				
					// Mark taxi spawn point as used/reserved
					usedParkSpawns.push(-(taxiPointID + 1));
					foundSpawnPoint = true;
					
					// NOTE: Set entire element state to "ready" (instead of "start" state) so
					// the element leader and any other planes on the taxi way do not wait for
					// other planes on the ramp/parking to start their engines.
					element.state = flightState.READY;
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
			
			element.forEach(function(plane) {

				var leaderPlane = element[0];
				var isLeader = (plane === leaderPlane);

				plane.distance = 0;

				// Compute plane distance to element leader plane
				if (!isLeader) {

					var posXDiff = leaderPlane.item.XPos - plane.item.XPos;
					var posZDiff = leaderPlane.item.ZPos - plane.item.ZPos;

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