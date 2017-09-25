/** @copyright Simas Toleikis, 2017 */

import {remote, ipcRenderer} from "electron"
import {observable, computed, action, reaction} from "mobx"
import {RealismPreset, isValidGamePath} from "."

// Launch mission state store
class LaunchStore {

	// Observables
	@observable gamePath
	@observable realismPreset = RealismPreset.Normal

	// Actions
	@action setGamePath = gamePath => this.gamePath = gamePath
	@action setRealismPreset = realismPreset => this.realismPreset = realismPreset

	constructor() {

		const {gamePath, realismPreset} = remote.getGlobal("config")

		// Load existing launch state from configuration data

		if (isValidGamePath(gamePath)) {
			this.gamePath = gamePath
		}

		const validRealismPresets = Object.values(RealismPreset)

		if (realismPreset !== undefined && validRealismPresets.includes(realismPreset)) {
			this.realismPreset = realismPreset
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
			realismPreset: this.realismPreset
		}
	}
}

export default new LaunchStore()