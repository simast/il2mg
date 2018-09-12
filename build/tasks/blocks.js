import path from "path"
import numeral from "numeral"
import data from "../../src/data"
import Item, {PRECISION_POSITION, PRECISION_ORIENTATION} from "../../src/item"

module.exports = function(grunt) {

	// Grunt task used to import/convert raw blocks .Group to .json files
	grunt.registerTask("build:blocks", "Build blocks JSON files.", () => {

		let totalBattles = 0
		let totalItems = 0

		// Process blocks for each battle
		for (const battleID in data.battles) {

			const battle = data.battles[battleID]
			const blocksPath = path.join("data", "battles", battleID, "blocks")

			// Process all blocks files
			battle.blocks.forEach(blockFile => {

				const fileSource = path.join(blocksPath, blockFile + ".Group")
				const fileDestination = path.join(blocksPath, blockFile + ".json")

				// Read raw blocks
				const blocks = Item.readTextFile(fileSource)

				const json = []

				// Build output JSON object with recursion
				;(function buildJSON(json, blocks) {

					blocks.forEach(block => {

						// Only import Block and Bridge type items
						// TODO: Also import block damage (from Damaged child items)
						if (block instanceof Item.Block || block instanceof Item.Bridge) {

							const itemTypeID = data.registerItemType({
								type: block.type,
								script: block.Script,
								model: block.Model
							})

							const jsonItem = []

							// Item type ID
							jsonItem.push(itemTypeID)

							// Item position
							jsonItem.push(Number(block.XPos.toFixed(PRECISION_POSITION)))
							jsonItem.push(Number(block.YPos.toFixed(PRECISION_POSITION)))
							jsonItem.push(Number(block.ZPos.toFixed(PRECISION_POSITION)))

							// Item orientation
							jsonItem.push(Number(block.YOri.toFixed(PRECISION_ORIENTATION)))

							json.push(jsonItem)

							totalItems++
						}
						// Process any child blocks
						else if (block instanceof Item.Group && block.items.length) {
							buildJSON(json, block.items)
						}
					})
				})(json, blocks)

				// Write output JSON blocks file
				grunt.file.write(
					fileDestination,
					JSON.stringify(json, null, "\t")
				)
			})

			totalBattles++
		}

		// Write items type JSON data file
		grunt.file.write(
			"data/items/index.json",
			JSON.stringify(data.items, null, "\t")
		)

		let message = ""

		message += numeral(totalItems).format("0,0") + " "
		message += grunt.util.pluralize(totalItems, "item/items")
		message += " processed from " + numeral(totalBattles).format("0,0") + " "
		message += grunt.util.pluralize(totalBattles, "battle/battles") + "."

		grunt.log.ok(message)
	})
}
