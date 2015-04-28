/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var planeSize = require("./airfields").planeSize;

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
	
	// Create all plane item objects
	flight.elements.forEach(function(element) {
		
		var unit = element.unit;
		
		element.forEach(function(plane) {
	
			var planeData = this.planesByID[plane.plane];
			var isPlayerPlane = (plane === flight.player);
			var isLeaderPlane = (plane === flight.leader);
			var validParkSpawns = [];
			
			// Make plane pilot
			plane.pilot = makeFlightPilot.call(this, unit);
	
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
			
			var Plane = Item.Plane;
			var planeItem = plane.item = flight.group.createItem("Plane");
			var positionX;
			var positionY;
			var positionZ;
			var orientation;
			
			// TODO: Sort validParkSpawns based on distance to the first taxi waypoint
	
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
	
				// 33% chance to start with engine running for non-leader and non-player planes
				if (!isPlayerPlane && !isLeaderPlane && rand.bool(0.33)) {
					planeItem.StartInAir = Plane.START_RUNWAY;
				}
				else {
					planeItem.StartInAir = Plane.START_PARKING;
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
	
			planeItem.setName(planeData.name);
			planeItem.setPosition(positionX, positionY, positionZ);
			planeItem.setOrientation(orientation);
			planeItem.Script = planeData.script;
			planeItem.Model = planeData.model;
			planeItem.Country = unit.country;
			planeItem.NumberInFormation = plane.number - 1;
			planeItem.Callnum = plane.number;
			planeItem.Callsign = flight.callsign[0];
	
			// Player plane item
			if (plane === flight.player) {
				planeItem.AILevel = Plane.AI_PLAYER;
			}
			// AI plane item
			// TODO: Set plane AI level based on pilot skill and difficulty command-line param
			else {
				planeItem.AILevel = Plane.AI_NORMAL;
			}
	
			// Create plane entity
			planeItem.createEntity();
	
			// Group subordinate planes with leader
			if (!isLeaderPlane) {
				planeItem.entity.addTarget(flight.leader.item.entity);
			}
			
		}, this);
	}, this);

	delete flight.spawns;
};