/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");
var planeSize = require("../airfields").planeSize;

// Make mission flight plane item objects
module.exports = function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set fuel
	// TODO: Set weapon mods
	// TODO: Set skins
	// TODO: Create pilots

	var mission = this;
	var rand = mission.rand;
	var unit = mission.unitsByID[flight.unit];
	var airfield = mission.airfieldsByID[flight.airfield];
	var usedTaxiSpawns = Object.create(null);
	var leaderPlane = flight.planes[0];
	
	// Create all plane item objects
	flight.planes.forEach(function(plane) {

		var planeData = mission.planesByID[plane.id];
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
		var planeObject = plane.item = flight.group.createItem("Plane");
		var positionX;
		var positionY;
		var positionZ;
		var orientation;

		// Try to use any of the valid spawn points
		var taxiSpawn = validTaxiSpawns.shift();

		// Use taxi spawn point
		if (taxiSpawn) {

			var spawnPoint = taxiSpawn.point;
			var positionOffsetMin = 10;
			var positionOffsetMax = 25;
			var orientationOffset = 15;

			positionX = spawnPoint.position[0];
			positionY = 0;
			positionZ = spawnPoint.position[1];
			orientation = spawnPoint.orientation;

			// Limit position offset for player-only taxi routes
			if (flight.taxi === 0) {

				positionOffsetMin = 5;
				positionOffsetMax = 12;
			}

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

			// 25% chance to start with engine running for non-leader and non-player planes
			if (!isPlayerPlane && !isLeaderPlane && rand.bool(0.25)) {
				planeObject.StartInAir = Plane.START_RUNWAY;
			}
			else {
				planeObject.StartInAir = Plane.START_PARKING;
			}

			// Mark spawn point as used/reserved
			usedTaxiSpawns[taxiSpawn.index] = true;
		}
		// Spawn in the air above airfield
		else {
			
			// TODO: Set orientation and tweak spawn distance
			// TODO: Set formation?
			positionX = airfield.position[0] + rand.integer(100, 300);
			positionY = airfield.position[1] + rand.integer(250, 450);
			positionZ = airfield.position[2] + rand.integer(100, 300);
			orientation = 0;
			
			planeObject.StartInAir = Plane.START_AIR;
		}

		planeObject.setName(planeData.name);
		planeObject.setPosition(positionX, positionY, positionZ);
		planeObject.setOrientation(orientation);
		planeObject.Script = planeData.script;
		planeObject.Model = planeData.model;
		planeObject.Country = unit.country;

		// Player plane item
		if (plane === flight.planes.player) {
			planeObject.AILevel = Plane.AI_PLAYER;
		}
		// AI plane item
		else {
			planeObject.AILevel = Plane.AI_NORMAL;
		}

		// Create plane entity
		planeObject.createEntity();

		// Group subordinate planes with leader
		if (!isLeaderPlane) {
			planeObject.entity.addTarget(leaderPlane.item.entity);
		}
	});

	delete flight.spawns;
};