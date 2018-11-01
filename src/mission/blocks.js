import path from 'path'

import {log} from '../log'
import {Bridge} from '../items'
import {data} from '../data'

// Generate mission static blocks
export default function makeBlocks() {

	const mission = this
	const blocksGroup = mission.createItem('Group')

	blocksGroup.setName('BLOCK')

	// Total block count
	let totalBlocks = 0
	let totalBridges = 0

	mission.battle.blocks.forEach(blocksFile => {

		const blocks = data.load(path.join(mission.battlePath, 'blocks', blocksFile))

		// Add all blocks to a group
		for (let i = 0; i < blocks.length; i++) {

			const blockItem = blocks[i]
			const block = mission.createItem(data.getItemType(blockItem[0]), blocksGroup)

			block.setPosition(blockItem[1], blockItem[2], blockItem[3])
			block.setOrientation(blockItem[4])

			totalBlocks++

			if (block instanceof Bridge) {
				totalBridges++
			}
		}
	})

	// Log mission blocks info
	log.I('Blocks:', totalBlocks, {bridges: totalBridges})
}
