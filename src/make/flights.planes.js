/** @copyright Simas Toleikis, 2015 */
"use strict";

var Plane = require("../item").Plane;
var planeSize = require("./airfields").planeSize;
var flightState = require("./flights.flight").flightState;

// Flight plane make parts
var makeFlightPilot = require("./flights.pilot");

// Make mission flight plane item objects
module.exports = function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set fuel
	// TODO: Set weapon mods
	// TODO: Set skin
	// TODO: Set pilot

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var usedParkSpawns = Object.create(null);
	var planeNumber = 1;
	
	// Process each flight element (section)
	flight.elements.forEach(function(element) {
		
		var unit = element.unit;
		
		// Create plane item objects
		element.forEach(function(plane, planeIndex) {
	
			var planeData = this.planesByID[plane.plane];
			var isPlayer = (plane === flight.player);
			var leaderPlane = element[0];
			var isLeader = (plane === leaderPlane);
			var validParkSpawns = [];

			// Make plane pilot
			var pilot = plane.pilot = makeFlightPilot.call(this, unit);

			// Build a list of valid taxi spawn points
			if (flight.spawns) {

				var planeSizeID = planeSize[String(planeData.size).toUpperCase()];
	
				flight.spawns.forEach(function(spawnPoint, spawnIndex) {
					
					var spawnID = spawnIndex + 1;
	
					if (!usedParkSpawns[spawnID] && spawnPoint.size >= planeSizeID) {
	
						validParkSpawns.push({
							id: spawnID,
							point: spawnPoint
						});
					}
				});
			}

			// Sort valid spawn points by size (planes will use best fit spawn point)
			validParkSpawns.sort(function(a, b) {
				return (a.point.size - b.point.size);
			});
			
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
				var positionOffsetMax = 25;
				var orientationOffset = 15;
				
				// Limit position offset for player-only taxi routes
				if (flight.taxi === 0) {
	
					positionOffsetMin = 5;
					positionOffsetMax = 12;
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
				
				var state = flight.state;
				
				// NOTE: Individual elements can have and override a global flight state
				if (element.state !== undefined) {
					state = element.state;
				}
				
				// Parking start, engine not running
				if (state === flightState.START) {
					
					planeItem.StartInAir = Plane.START_PARKING;
					
					// 50% chance to start with engine running for non-leader and non-player planes
					if (!isPlayer && !isLeader && rand.bool(0.5)) {
						planeItem.StartInAir = Plane.START_RUNWAY;
					}
				}
				// Ready, taxi or runway start with engine running
				else if (!Number.isNumber(state)) {
					planeItem.StartInAir = Plane.START_RUNWAY;
				}
				// Air start
				else {
					planeItem.StartInAir = Plane.START_AIR;
				}
	
				// Mark spawn point as used/reserved
				usedParkSpawns[parkSpawn.id] = true;
			}
			// Spawn in the air above airfield
			else {
				
				// TODO: Set orientation and tweak spawn distance
				// TODO: Set formation?
				positionX = airfield.position[0] + rand.integer(150, 300);
				positionY = airfield.position[1] + rand.integer(200, 400);
				positionZ = airfield.position[2] + rand.integer(150, 300);
				orientation = 0;
				
				planeItem.StartInAir = Plane.START_AIR;
			}
			
			// Set plane name for player flight planes only
			// NOTE: Required for the radio message UI to not report distant plane/pilot IDs
			if (flight.player && !isPlayer) {
				planeItem.setName(pilot.id);
			}
			
			planeItem.setPosition(positionX, positionY, positionZ);
			planeItem.setOrientation(orientation);
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
	
			// Create plane entity
			planeItem.createEntity();
	
			// Group subordinate planes with element leader
			if (!isLeader) {
				planeItem.entity.addTarget(leaderPlane.item.entity);
			}
			
			plane.distance = 0;

			// Compute plane distance to element leader plane
			if (!isLeader) {

				var posXDiff = leaderPlane.item.XPos - planeItem.XPos;
				var posYDiff = leaderPlane.item.YPos - planeItem.YPos;
				var posZDiff = leaderPlane.item.ZPos - planeItem.ZPos;

				plane.distance = Math.sqrt(
					Math.pow(posXDiff, 2) + Math.pow(posYDiff, 2) + Math.pow(posZDiff, 2)
				);
			}

		}, this);

		// Sort element planes based on the distance to the element leader
		// NOTE: Will make sure that they don't get in the way while taxiing and forming up
		element.sort(function(a, b) {
			return (a.distance - b.distance);
		});
		
		// Set plane number and formation index
		element.forEach(function(plane, planeIndex) {

			plane.item.NumberInFormation = planeIndex;
			plane.item.Callnum = planeNumber;
			plane.number = planeNumber;
			
			planeNumber++;
		});

	}, this);

	delete flight.spawns;
};