/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");

// Generate mission static blocks
module.exports = function makeBlocks() {

	const blocksFiles = this.battle.blocks;
	const blocksGroup = this.createItem("Group");

	blocksGroup.setName("BLOCK");

	// Total block count
	let totalBlocks = 0;
	let totalBridges = 0;

	blocksFiles.forEach((blocksFile) => {

		const blocks = require("../../data/battles/" + this.battleID + "/blocks/" + blocksFile);

		// Add all blocks to a group
		for (let i = 0; i < blocks.length; i++) {

			const blockItem = blocks[i];
			const itemType = DATA.getItemType(blockItem[0]);
			const block = blocksGroup.createItem(itemType.type);

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