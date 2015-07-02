/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission static blocks
module.exports = function makeBlocks() {

	var mission = this;
	var blocksFiles = mission.battle.blocks;
	var blocksGroup = mission.createItem("Group");

	blocksGroup.setName("BLOCK");

	// Total block count
	var totalBlocks = 0;
	var totalBridges = 0;

	blocksFiles.forEach(function(blocksFile) {

		var blocks = require("../../data/battles/" + mission.battleID + "/blocks/" + blocksFile);

		// Add all blocks to a group
		for (var i = 0; i < blocks.length; i++) {

			var blockItem = blocks[i];
			var itemType = DATA.getItemType(blockItem[0]);
			var block = blocksGroup.createItem(itemType.type);

			block.Model = itemType.model;
			block.Script = itemType.script;
			block.setPosition(blockItem[1], blockItem[2], blockItem[3]);
			block.setOrientation(blockItem[4]);

			totalBlocks++;

			if (block instanceof Item.Bridge) {
				totalBridges++;
			}
		}
	});

	// Log mission blocks info
	log.I("Blocks:", totalBlocks, {bridges: totalBridges});
};