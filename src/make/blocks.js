/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission static blocks
module.exports = function(mission, data) {

	var blocksFiles = mission.battle.blocks;
	var blocksGroup = new Item.Group();

	blocksGroup.setName("Blocks");

	blocksFiles.forEach(function(blocksFile) {

		var blocks = require("../../data/battles/" + mission.battleID + "/blocks/" + blocksFile);

		// Add all blocks to a group
		for (var i = 0; i < blocks.length; i++) {

			var blockItem = blocks[i];
			var itemType = data.getItemType(blockItem[0]);
			var block = new Item[itemType.type]();

			block.Model = itemType.model;
			block.Script = itemType.script;
			block.setPosition(blockItem[1], blockItem[2]);
			block.setOrientation(blockItem[3]);

			// TODO: Build a blocks index (to quickly lookup blocks based on position)

			blocksGroup.addItem(block);
		}
	});

	// Add all blocks as a single group in a mission file
	mission.addItem(blocksGroup);
};