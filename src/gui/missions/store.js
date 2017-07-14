/** @copyright Simas Toleikis, 2017 */
"use strict"

const fs = global.require("fs")
const path = global.require("path")
const {remote} = global.require("electron")
const {observable, action} = require("mobx")
const {FileExtension} = require("./constants")

// Missions state store
class MissionsStore {

	// Missions directory path
	path = remote.getGlobal("config").missionsPath

	// Sorted list of mission objects
	@observable.ref list = []

	// Mission objects indexed by ID
	index = Object.create(null)

	// Load missions from missions directory
	@action load() {

		const list = []
		const index = Object.create(null)
		const files = Object.create(null)

		// Scan each file in the target path/directory
		fs.readdirSync(this.path).forEach(fileName => {

			const missionID = path.basename(fileName, path.extname(fileName))

			// Collect all files grouped by mission ID
			if (!files[missionID]) {
				files[missionID] = []
			}

			files[missionID].push(fileName)

			// Process only mission metadata files
			if (path.extname(fileName) !== ("." + FileExtension.Meta)) {
				return
			}

			let mission

			try {

				// Read mission metadata file
				mission = JSON.parse(
					fs.readFileSync(this.path + path.sep + fileName, "utf-8")
				)
			}
			catch (e) {
				return
			}

			mission.id = missionID
			mission.files = files[missionID]

			list.push(mission)
			index[missionID] = mission
		})

		// Sort missions list based on id (new missions first)
		if (list.length > 1) {
			list.sort((a, b) => b.id.localeCompare(a.id))
		}

		this.list = list
		this.index = index
	}
}

module.exports = new MissionsStore()