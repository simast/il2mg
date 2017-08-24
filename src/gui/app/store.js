/** @copyright Simas Toleikis, 2017 */
"use strict"

import {remote, ipcRenderer} from "electron"
import {observable, computed, action, reaction} from "mobx"
import {Difficulty} from "./"

// Application state store
class AppStore {

	// Observables
	@observable gamePath
	@observable difficulty = Difficulty.Normal

	// Actions
	@action setGamePath = gamePath => this.gamePath = gamePath
	@action setDifficulty = difficulty => this.difficulty = difficulty

	constructor() {

		const {gamePath, difficulty} = remote.getGlobal("config")

		// Load existing app state from configuration data

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

	// Application state representation as configuration data
	@computed get config() {

		return {
			gamePath: this.gamePath,
			difficulty: this.difficulty
		}
	}
}

export default new AppStore()