/** @copyright Simas Toleikis, 2017 */
"use strict"

const {remote, ipcRenderer} = global.require("electron")
const {observable, computed, action, reaction} = require("mobx")
const {Start, Battle} = require("./constants")

// Create mission state store
class CreateMissionStore {

	// Data index for all supported battles
	battles = {
		[Battle.Stalingrad]: require("../../../data/battles/stalingrad")
	}

	// Observables
	@observable battle = Battle.Stalingrad
	@observable date = ""
	@observable start = Start.Parking
	@observable.ref choice = {}

	// Actions
	@action setBattle = battle => this.battle = battle
	@action setDate = date => this.date = date
	@action setStart = start => this.start = start
	@action setChoice = choice => this.choice = choice

	constructor() {

		// Load data index for all supported battles
		this.battles = {
			[Battle.Stalingrad]: Object.freeze(require("../../../data/battles/stalingrad"))
		}

		const {battle, date, start, choice} = remote.getGlobal("config")

		// Load existing create mission state from configuration data

		if (start !== undefined && Object.values(Start).includes(start)) {
			this.start = start
		}

		if (battle !== undefined && Object.values(Battle).includes(battle)) {
			this.battle = battle
		}

		if (typeof date === "string" && date in this.battles[this.battle].dates) {
			this.date = date
		}

		if (typeof choice === "object") {
			this.choice = choice
		}

		// Send configuration data to main Electron process
		reaction(
			() => this.config,
			config => {
				ipcRenderer.sendSync("setConfig", config)
			}
		)
	}

	// Create mission state representation as configuration data
	@computed get config() {

		return {
			battle: this.battle,
			date: this.date,
			start: this.start,
			choice: this.choice
		}
	}
}

module.exports = new CreateMissionStore()