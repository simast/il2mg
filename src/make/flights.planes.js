/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var planeSize = require("./airfields").planeSize;

// Make mission flight plane item objects
module.exports = function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set fuel
	// TODO: Set weapon mods
	// TODO: Set skin
	// TODO: Set pilot

	var rand = this.rand;
	var unit = this.unitsByID[flight.unit];
	var airfield = this.airfieldsByID[flight.airfield];
	var usedTaxiSpawns = Object.create(null);
	var leaderPlane = flight.planes[0];
	
	// Create all plane item objects
	flight.planes.forEach(function(plane, planeIndex) {

		var planeData = this.planesByID[plane.id];
		var isPlayerPlane = (plane === flight.planes.player);
		var isLeaderPlane = (plane === leaderPlane);
		var validTaxiSpawns = [];

		// Build a list of valid taxi spawn points
		if (flight.spawns) {

			var planeSizeID = planeSize[String(planeData.size).toUpperCase()];

			flight.spawns.forEach(function(spawnPoint, spawnIndex) {

				if (!usedTaxiSpawns[spawnIndex] && spawnPoint.size >= planeSizeID) {

					validTaxiSpawns.push({
						index: spawnIndex,
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
		
		// TODO: Sort validTaxiSpawns based on distance to the first taxi waypoint

		// Try to use any of the valid spawn points
		var taxiSpawn = validTaxiSpawns.shift();

		// Use taxi spawn point
		if (taxiSpawn) {

			var spawnPoint = taxiSpawn.point;
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

				spawnPoint.plane.remove();

				delete spawnPoint.planeGroup;
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
			usedTaxiSpawns[taxiSpawn.index] = true;
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
		planeItem.NumberInFormation = planeIndex;
		planeItem.Callnum = planeIndex + 1;
		planeItem.Callsign = flight.callsign[0];

		// Player plane item
		if (plane === flight.planes.player) {
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
			planeItem.entity.addTarget(leaderPlane.item.entity);
		}
		
	}, this);

	delete flight.spawns;
};