/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;
var planeSize = require("./airfields").planeSize;
var flightState = require("./flights.flight").flightState;

// Make mission flight plane item objects
module.exports = function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set weapon mods

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var usedParkSpawns = Object.create(null);
	var planeNumber = flight.planes;

	// Process each flight element (section) in reverse
	for (var e = flight.elements.length - 1; e >= 0; e--) {
		
		var element = flight.elements[e];
		var unit = element.unit;

		// Only the first element can start without engines running
		if (element.state === flightState.START && e > 0) {
			element.state = flightState.READY;
		}

		// Process each plane in reverse
		for (var p = element.length - 1; p >= 0; p--) {

			var plane = element[p];
			var planeData = this.planesByID[plane.plane];
			var isPlayer = (plane === flight.player);
			var lastPlane = element[p + 1];
			var isLeader = (p === 0);
			var validParkSpawns = [];
			var pilot = plane.pilot;

			// Build a list of valid taxi spawn points
			if (flight.spawns) {

				var planeSizeID = planeSize[String(planeData.size).toUpperCase()];

				flight.spawns.forEach(function(spawnPoint, spawnIndex) {

					var spawnID = spawnIndex + 1;

					if (!usedParkSpawns[spawnID] && spawnPoint.size >= planeSizeID) {

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
				// the same ramp start as they will be grouped together and the flight
				// formation will not be mixed up.
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

			// Try to use any of the valid parking spawn points
			var parkSpawn = validParkSpawns.shift();

			// Use taxi spawn point
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
	
				// Mark spawn point as used/reserved
				usedParkSpawns[parkSpawn.id] = true;

				// Set plane item parking start position and orientation
				planeItem.setPosition(positionX, positionY, positionZ);
				planeItem.setOrientation(orientation);
			}
			// Spawn in the air above airfield
			else {
				
				// Force air start to entire element when any of the planes are spawned
				// in the air (required for the planes in the air to not crash).
				element.state = 0;

				// TODO: Free up park spawns for other flight elements
				usedParkSpawns = Object.create(null);
			}
			
			// Set plane name to pilot ID for player flight planes only
			// NOTE: Required for the radio message UI to not report distant plane/pilot IDs
			if (flight.player && !isPlayer && pilot.id) {
				planeItem.setName(pilot.id);
			}

			planeItem.Script = planeData.script;
			planeItem.Model = planeData.model;
			planeItem.Country = unit.country;
			planeItem.Callsign = flight.callsign[0];

			// TODO: Set plane names for player flight
	
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
			
			for (var p = element.length - 1; p >= 0; p--) {

				var plane = element[p];
				var planeItem = plane.item;
				var isPlayer = (plane === flight.player);
				var isLeader = (p === 0);

				// Group subordinate planes with element leader
				if (element.length > 1 && p > 0) {
					plane.item.entity.addTarget(element[0].item.entity);
				}

				// Set plane number and formation index
				if (flight.planes > 1) {
					
					plane.item.NumberInFormation = p;
					plane.item.Callnum = planeNumber;
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