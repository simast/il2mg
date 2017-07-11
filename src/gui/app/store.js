/** @copyright Simas Toleikis, 2017 */
"use strict"

const {remote, ipcRenderer} = global.require("electron")
const {observable, computed, action, reaction} = require("mobx")
const {Difficulty} = require("./constants")

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
				ipcRenderer.sendSync("config", config)
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

module.exports = new AppStore()