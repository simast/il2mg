/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

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

		airfield.blocks.forEach(function(blockItem) {

			var blockType = data.getBlock(blockItem[0]);
			var block = new Block(blockType.type);

			block.Model = blockType.model;
			block.Script = blockType.script;
			block.setPosition(blockItem[1], blockItem[2], blockItem[3]);

			// Compressed orientation value
			if (blockItem[5] === undefined) {
				block.setOrientation(0, blockItem[4], 0);
			}
			// Normal orientation value
			else {
				block.setOrientation(blockItem[4], blockItem[5], blockItem[6]);
			}

			// TODO: Build a blocks index (to quickly lookup blocks based on position)

			blocksGroup.blocks.push(block);
		});

		// Add all blocks as a single airfield group in a mission file
		mission.blocks.push(blocksGroup);
	}
};