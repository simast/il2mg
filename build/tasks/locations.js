/** @copyright Simas Toleikis, 2016 */

import numeral from "numeral"
import data from "../../src/data"
import Item, {PRECISION_POSITION} from "../../src/item"

module.exports = function(grunt) {

	// Grunt task used to import/convert locations .Group to .json files
	grunt.registerTask("build:locations", "Build locations JSON files.", () => {

		// Data constants
		const location = data.location

		let totalBattles = 0
		let totalItems = 0

		// Process locations for each battle
		for (const battleID in data.battles) {

			const battle = data.battles[battleID]
			const locationsPath = "data/battles/" + battleID + "/locations/"

			// Process all location files
			battle.locations.forEach(locationFile => {

				const fileSource = locationsPath + locationFile + ".Group"
				const fileDestination = locationsPath + locationFile + ".json"

				// Read raw locations
				const items = Item.readTextFile(fileSource)

				// Group file should have a non-empty single Group item
				if (!items || !items.length || items.length !== 1 ||
						!(items[0] instanceof Item.Group)) {

					return
				}

				const json = []

				// Build output JSON object with recursion
				;(function buildJSON(json, items) {

					items.forEach(item => {

						// Process locations from reference point items
						if (item.type === "MCU_H_ReferencePoint") {

							const jsonItem = []
							const itemData = item.Name.split(":")

							// Find matching location type ID
							const itemType = location[Object.keys(location).find(type => (
								itemData[0].startsWith(type)
							))]

							// Validate location type
							if (!itemType) {
								grunt.fail.fatal("Invalid location type: " + itemData[0])
							}

							// Item type
							jsonItem.push(itemType)

							// Item position
							// NOTE: Locations do not need sub-meter X/Z axis precision
							jsonItem.push(Math.round(item.XPos))
							jsonItem.push(Number(item.YPos.toFixed(PRECISION_POSITION)))
							jsonItem.push(Math.round(item.ZPos))

							// Item reference zone dimensions (forward, right, backward, left)
							jsonItem.push(Math.round(item.Forward))
							jsonItem.push(Math.round(item.Right))
							jsonItem.push(Math.round(item.Backward))
							jsonItem.push(Math.round(item.Left))

							// Optional item name
							const itemName = itemData[1] ? itemData[1].trim() : ""

							if (itemName.length) {
								jsonItem.push(itemName)
							}

							json.push(jsonItem)

							totalItems++
						}
						// Process any locations inside groups
						else if (item instanceof Item.Group && item.items.length) {
							buildJSON(json, item.items)
						}
					})
				})(json, items)

				// Write output JSON locations file
				grunt.file.write(
					fileDestination,
					JSON.stringify(json, null, "\t")
				)
			})

			totalBattles++
		}

		let message = ""

		message += numeral(totalItems).format("0,0") + " "
		message += grunt.util.pluralize(totalItems, "item/items")
		message += " processed from " + numeral(totalBattles).format("0,0") + " "
		message += grunt.util.pluralize(totalBattles, "battle/battles") + "."

		grunt.log.ok(message)
	})
}