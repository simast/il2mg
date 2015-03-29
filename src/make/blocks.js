/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission static blocks
module.exports = function(mission, data) {

	var blocksFiles = mission.battle.blocks;
	var blocksGroup = new Item.Group();

	blocksGroup.setName("Blocks");

	// Total block count
	var totalBlocks = 0;
	var totalBridges = 0;

	blocksFiles.forEach(function(blocksFile) {

		var blocks = require("../../data/battles/" + mission.battleID + "/blocks/" + blocksFile);

		// Add all blocks to a group
		for (var i = 0; i < blocks.length; i++) {

			var blockItem = blocks[i];
			var itemType = data.getItemType(blockItem[0]);
			var block = mission.createItem(itemType.type);

			block.Model = itemType.model;
			block.Script = itemType.script;
			block.setPosition(blockItem[1], blockItem[2]);
			block.setOrientation(blockItem[3]);

			// TODO: Build a blocks index (to quickly lookup blocks based on position)
			blocksGroup.addItem(block);

			totalBlocks++;

			if (block instanceof Item.Bridge) {
				totalBridges++;
			}
		}
	});

	// Add all blocks as a single group in a mission file
	mission.addItem(blocksGroup);

	// Log mission blocks info
	log.I("Blocks:", totalBlocks, {bridges: totalBridges});
};