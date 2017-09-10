/** @copyright Simas Toleikis, 2017 */

import fs from "fs"
import path from "path"

// Difficulty preset
export const Difficulty = Object.freeze({
	Custom: 0,
	Normal: 1,
	Expert: 2
})

// Game paths
export const PATH_GAME_DATA = "data"
export const PATH_GAME_EXE = path.join("bin", "game", "Il-2.exe")

// Check if specified game path is valid
export function isValidGamePath(gamePath) {

	if (!gamePath) {
		return false
	}

	// Check for "data" directory
	try {

		const dataPath = path.join(gamePath, PATH_GAME_DATA)
		const hasDataDirectory = fs.statSync(dataPath).isDirectory()

		if (!hasDataDirectory) {
			return false
		}
	}
	catch (e) {
		return false
	}

	// Check for game executable
	return fs.existsSync(path.join(gamePath, PATH_GAME_EXE))
}