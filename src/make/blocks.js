/** @copyright Simas Toleikis, 2015 */
"use strict"

const path = require("path")
const log = require("../log")
const {Bridge} = require("../item")
const data = require("../data")

// Generate mission static blocks
module.exports = function makeBlocks() {

	const blocksGroup = this.createItem("Group")

	blocksGroup.setName("BLOCK")

	// Total block count
	let totalBlocks = 0
	let totalBridges = 0

	this.battle.blocks.forEach(blocksFile => {

		const blocks = data.load(path.join(this.battlePath, "blocks", blocksFile))

		// Add all blocks to a group
		for (let i = 0; i < blocks.length; i++) {

			const blockItem = blocks[i]
			const block = blocksGroup.createItem(data.getItemType(blockItem[0]))

			block.setPosition(blockItem[1], blockItem[2], blockItem[3])
			block.setOrientation(blockItem[4])

			totalBlocks++

			if (block instanceof Bridge) {
				totalBridges++
			}
		}
	})

	// Log mission blocks info
	log.I("Blocks:", totalBlocks, {bridges: totalBridges})
}