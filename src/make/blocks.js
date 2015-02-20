/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Generate mission blocks
module.exports = function(mission, data) {

	var blocksFiles = mission.battle.blocks;
	var blocksGroup = new Block.Group();

	blocksGroup.setName("Blocks");

	blocksFiles.forEach(function(blocksFile) {

		var blocks = require("../../data/battles/" + mission.battleID + "/blocks/" + blocksFile);

		// Add all blocks to a group
		for (var i = 0; i < blocks.length; i++) {

			var blockItem = blocks[i];
			var blockType = data.getBlock(blockItem[0]);
			var block = new Block[blockType.type]();

			block.Model = blockType.model;
			block.Script = blockType.script;
			block.setPosition(blockItem[1], blockItem[2]);
			block.setOrientation(blockItem[3]);

			// TODO: Build a blocks index (to quickly lookup blocks based on position)

			blocksGroup.addBlock(block);
		}
	});

	// Add all blocks as a single group in a mission file
	mission.addBlock(blocksGroup);
};