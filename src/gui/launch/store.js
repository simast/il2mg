/** @copyright Simas Toleikis, 2017 */

import {remote, ipcRenderer} from "electron"
import {observable, computed, action, reaction} from "mobx"
import {Difficulty} from "."

// Launch mission state store
class LaunchStore {

	// Observables
	@observable gamePath
	@observable difficulty = Difficulty.Normal

	// Actions
	@action setGamePath = gamePath => this.gamePath = gamePath
	@action setDifficulty = difficulty => this.difficulty = difficulty

	constructor() {

		const {gamePath, difficulty} = remote.getGlobal("config")

		// Load existing launch state from configuration data

		this.gamePath = gamePath

		if (difficulty !== undefined && Object.values(Difficulty).includes(difficulty)) {
			this.difficulty = difficulty
		}

		// Send configuration data to main Electron process
		reaction(
			() => this.config,
			config => {
				ipcRenderer.sendSync("setConfig", config)
			}
		)
	}

	// Launch state representation as configuration data
	@computed get config() {

		return {
			gamePath: this.gamePath,
			difficulty: this.difficulty
		}
	}
}

export default new LaunchStore()