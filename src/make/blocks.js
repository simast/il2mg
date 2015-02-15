/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Generate mission blocks
module.exports = function(mission) {

	var missionBlocks = mission.battle.blocks;
	var blockGroup = new Block(Block.GROUP);

	blockGroup.setName("Blocks");

	missionBlocks.forEach(function(blockFile) {

		var blockData = require("../../data/battles/" + mission.battleID + "/blocks/" + blockFile);

		var types = blockData.types;
		var models = blockData.models;
		var scripts = blockData.scripts;
		var blocks = blockData.blocks;

		// Add all blocks to a group
		for (var i = 0; i < blocks.length; i++) {

			var blockItem = blocks[i];
			var block = new Block(types[blockItem[0]]);

			block.Model = models[blockItem[1]];
			block.Script = scripts[blockItem[2]];
			block.setPosition(blockItem[3], blockItem[4], blockItem[5]);
			block.setOrientation(blockItem[6], blockItem[7], blockItem[8]);

			blockGroup.blocks.push(block);
		}
	});

	// Add all blocks as a single group to mission file
	mission.blocks.push(blockGroup);
};