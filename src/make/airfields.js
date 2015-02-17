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
	var airfields = mission.battle.airfields;

	for (var airfieldID in airfields) {

		var airfield = airfields[airfieldID];

		// Draw airfield icons on the map in debug mode
		if (params.debug) {

			// Make a list of active battle coalitions
			var activeCoalitions = [];

			// Unknown coalition
			activeCoalitions.push(0);

			// Coalitions from active countries
			battle.countries.forEach(function(countryID) {
				activeCoalitions.push(data.countries[countryID].coalition);
			});

			var airfieldIcon = new Block(Block.ICON);

			airfieldIcon.IconId = 903;
			airfieldIcon.setPosition(airfield.position);
			airfieldIcon.setCoalitions(activeCoalitions);
			airfieldIcon.setName(mission.getLC(airfield.name));

			mission.blocks.push(airfieldIcon);
		}

		if (!airfield.blocks || !airfield.blocks.length) {
			continue;
		}

		var blocksGroup = new Block(Block.GROUP);

		blocksGroup.setName(airfield.name);

		// Walk/process each airfield block
		(function walkBlocks(blocks) {

			blocks.forEach(function(blockItem) {

				var blockTypeID = blockItem[0];

				// Process block group
				if (Array.isArray(blockTypeID)) {
					walkBlocks(blockItem);
				}

				// Normal blocks only
				if (blockTypeID >= 0) {

					var blockType = data.getBlock(blockTypeID);
					var blockData = blockItem[5];
					var block = new Block(blockType.type);

					block.Model = blockType.model;
					block.Script = blockType.script;
					block.setPosition(blockItem[1], blockItem[2], blockItem[3]);
					block.setOrientation(0, blockItem[4], 0);

					// Windsock tag
					if (blockData === blockTags.WINDSOCK) {
						block.createEntity();
					}

					// TODO: Build a blocks index (to quickly lookup blocks based on position)

					blocksGroup.blocks.push(block);
				}
			});
		})(airfield.blocks);

		// Add all blocks as a single airfield group in a mission file
		mission.blocks.push(blocksGroup);
	}
};

module.exports.blockTags = blockTags;