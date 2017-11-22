import fs from "fs"
import path from "path"
import {remote} from "electron"
import {PATH_GAME_DATA} from "../launch"
import launchStore from "../launch/store"
import {FileExtension} from "../missions"
import missionsStore from "../missions/store"

// Load missions from missions directory
export function loadMissions() {

	const list = []
	const index = Object.create(null)
	const files = Object.create(null)

	// Scan each file in the target path/directory
	fs.readdirSync(missionsStore.path).forEach(fileName => {

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
				fs.readFileSync(missionsStore.path + path.sep + fileName, "utf-8")
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

	missionsStore.setMissions(list, index)
}

// Save mission
export function saveMission(missionID) {

	if (!missionID) {
		return
	}

	const {gamePath} = launchStore
	const mission = missionsStore.index[missionID]
	let savePath

	// Use missions folder as default save path destination
	if (gamePath) {
		savePath = path.join(gamePath, PATH_GAME_DATA, "Missions")
	}
	// Use desktop as default save path destination
	else {
		savePath = remote.app.getPath("desktop")
	}

	// Suggest default mission file name
	savePath = path.join(savePath, missionID)

	// Find main mission file extension (either binary or text)
	let mainExtension = FileExtension.Text

	for (const missionFile of mission.files) {

		if (path.extname(missionFile) === ("." + FileExtension.Binary)) {

			mainExtension = FileExtension.Binary
			break
		}
	}

	// Show save mission dialog
	savePath = remote.dialog.showSaveDialog(
		remote.getCurrentWindow(),
		{
			defaultPath: savePath,
			filters: [
				{
					name: "Mission files (*." + mainExtension + ")",
					extensions: [mainExtension]
				}
			]
		}
	)

	// Save mission
	if (savePath) {

		const saveDir = path.dirname(savePath)
		const saveFile = path.basename(savePath, path.extname(savePath))

		// Save (copy) all mission files (except metadata file)
		for (const missionFile of mission.files) {

			const extension = path.extname(missionFile)

			if (extension === ("." + FileExtension.Meta)) {
				continue
			}

			fs.writeFileSync(
				path.join(saveDir, saveFile + extension),
				fs.readFileSync(path.join(missionsStore.path, missionFile))
			)
		}
	}
}

// Remove mission
export function removeMission(missionID, confirm = false) {

	if (!missionID) {
		return false
	}

	const mission = missionsStore.index[missionID]

	if (!mission) {
		return false
	}

	let result = 0

	if (confirm) {

		// Confirm mission remove action
		result = remote.dialog.showMessageBox(
			remote.getCurrentWindow(),
			{
				type: "warning",
				title: "Remove Mission",
				message: "Are you sure you want to remove this mission?",
				buttons: ["Remove", "Cancel"],
				defaultId: 0,
				noLink: true
			}
		)
	}

	if (result !== 0) {
		return false
	}

	const {files} = mission
	const removedIndex = missionsStore.list.indexOf(mission)

	// Remove mission files
	for (const fileName of files) {
		fs.unlinkSync(path.join(missionsStore.path, fileName))
	}

	return removedIndex
}