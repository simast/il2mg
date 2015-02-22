/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Data tags for airfield blocks
var blockTags = {
	AA_FLAK: -6, // Anti-aircraft (Flak)
	AA_MG: -5, // Anti-aircraft (MG)
	CAR: -4, // Car vehicle
	TRUCK_FUEL: -3, // Fuel truck
	TRUCK_CARGO: -2, // Cargo truck
	PLANE: -1, // Plane spot
	DECO: 1, // Decoration
	FUEL: 2, // Fuel block
	WINDSOCK: 3, // Windsock
	BEACON: 4 // Beacon
};

// Generate mission airfields
module.exports = function(mission, data) {

	var params = mission.params;
	var battle = mission.battle;
	var airfields = battle.airfields;

	for (var airfieldID in airfields) {

		var airfield = airfields[airfieldID];

		if (!airfield.blocks || !airfield.blocks.length) {
			continue;
		}

		var blocksGroup = new Block.Group();

		blocksGroup.setName(airfield.name);

		// Walk/process each airfield block
		(function walkBlocks(blocks, isGroup) {

			// Used to delay normal block insertion until any of the special blocks
			// were included in a group. If no special blocks are used - all normal
			// blocks in a group are also not included. This allows to group, for
			// example, an anti-aircraft special block together with a normal decoration
			// block, but if the AA special block is not used - the AA decoration block
			// is also not included.
			var extraBlocks = [];
			var useExtraBlocks = false;

			blocks.forEach(function(block) {

				var blockTypeID = block[0];

				// Process block group
				if (Array.isArray(blockTypeID)) {
					walkBlocks(block, true);
				}

				var blockObjects = [];

				// Normal static block
				if (blockTypeID >= 0) {

					if (isGroup) {
						extraBlocks.push(block);
					}
					else {
						blockObjects = makeStaticBlock(block);
					}
				}
				// Special block
				else {

					switch (blockTypeID) {

						// Stationary/static vehicle block
						case blockTags.TRUCK_CARGO:
						case blockTags.TRUCK_FUEL:
						case blockTags.CAR: {

							blockObjects = makeStaticVehicle(block);
							break;
						}

						// Anti-aircraft vehicle block
						case blockTags.AA_FLAK:
						case blockTags.AA_MG: {

							blockObjects = makeAAVehicle(block);
							break;
						}
					}

					// Use all extra normal blocks in a group if special block is used
					if (blockObjects.length) {
						useExtraBlocks = true;
					}
				}

				// Add generated block objects to airfield group
				if (Array.isArray(blockObjects) && blockObjects.length) {

					blockObjects.forEach(function(blockObject) {

						// TODO: Build a blocks index (to quickly lookup blocks based on position)
						blocksGroup.addBlock(blockObject);
					});
				}
			});

			// Include extra blocks
			if (useExtraBlocks && extraBlocks.length) {
				walkBlocks(extraBlocks, false);
			}

		})(mission.rand.shuffle(airfield.blocks), false);

		// Add all blocks as a single airfield group in a mission file
		mission.addBlock(blocksGroup);
	}

	// Make a normal static block
	function makeStaticBlock(block) {

		var blockType = data.getBlock(block[0]);
		var blockData = block[4];

		var blockObject = new Block[blockType.type]();

		blockObject.Model = blockType.model;
		blockObject.Script = blockType.script;
		blockObject.setPosition(block[1], block[2]);
		blockObject.setOrientation(block[3]);

		// Windsock tag
		if (blockData === blockTags.WINDSOCK) {
			blockObject.createEntity();
		}
		// Beacon tag
		else if (blockData === blockTags.BEACON) {
			blockObject.createEntity();
		}

		return [blockObject];
	}

	// Make a stationary/static vehicle block
	function makeStaticVehicle(block) {

		var staticVehicles = makeStaticVehicle.data;

		// Build an indexed list of all static vehicles per country and type
		if (!makeStaticVehicle.data) {

			staticVehicles = makeStaticVehicle.data = {};

			for (var i = 0; i < data.vehicles.length; i++) {

				var vehicle = data.vehicles[i];

				if (!vehicle.static) {
					continue;
				}

				vehicle.countries.forEach(function(countryID) {

					if (!staticVehicles[countryID]) {
						staticVehicles[countryID] = {};
					}

					if (!staticVehicles[countryID][vehicle.type]) {
						staticVehicles[countryID][vehicle.type] = [];
					}

					staticVehicles[countryID][vehicle.type].push(vehicle);
				});
			}
		}

		// TODO: Pick from a list of countries with presence (from units)
		var countryID = 201;

		if (!staticVehicles[countryID]) {
			return;
		}

		var vehicleType;

		if (block[0] === blockTags.TRUCK_CARGO) {
			vehicleType = "truck_cargo";
		}
		else if (block[0] === blockTags.TRUCK_FUEL) {
			vehicleType = "truck_fuel";
		}

		if (!vehicleType || !staticVehicles[countryID][vehicleType]) {
			return;
		}

		// TODO: Limit number of static vehicles based on number of units on the airfield
		var randVehicle = mission.rand.pick(staticVehicles[countryID][vehicleType]);

		// Create static vehicle block
		var blockObject = new Block.Block();

		// Slightly vary/randomize static vehicle position
		var positionX = Math.max(block[1] + mission.rand.real(-1, 1), 0);
		var positionZ = Math.max(block[2] + mission.rand.real(-1, 1), 0);

		// Slightly vary/randomize static vehicle orientation
		var orientation = Math.max((block[3] + mission.rand.real(-20, 20) + 360) % 360, 0);

		blockObject.Model = randVehicle.static.model;
		blockObject.Script = randVehicle.static.script;
		blockObject.setPosition(positionX, positionZ);
		blockObject.setOrientation(orientation);

		return [blockObject];
	}

	// Make anti-aircraft vehicle block
	function makeAAVehicle(block) {

		var blockObject = new Block.Vehicle();

		blockObject.Model = "graphics\\artillery\\mg34-aa\\mg34-aa.mgm";
		blockObject.Script = "LuaScripts\\WorldObjects\\vehicles\\mg34-aa.txt";
		// blockObject.Model = "graphics\\characters\\BotField_SoldierGER\\SoldierGER.MGM";
		// blockObject.Script = "LuaScripts\\WorldObjects\\bots\\botfield_soldierger.txt";
		blockObject.setPosition(block[1], block[2]);
		blockObject.setOrientation(block[3]);

		blockObject.createEntity();

		return [blockObject];
	}
};

module.exports.blockTags = blockTags;