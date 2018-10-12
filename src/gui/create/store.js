import fs from 'fs'
import path from 'path'
import {remote, ipcRenderer} from 'electron'
import {observable, computed, action, reaction} from 'mobx'
import {Start, Battle} from '.'

// Create mission state store
class CreateStore {

	// Data index for all supported battles
	battles = {
		[Battle.Stalingrad]: JSON.parse(fs.readFileSync(
			path.join(remote.app.getAppPath(), 'data', 'battles', Battle.Stalingrad, 'index') + '.json',
			'utf-8'
		))
	}

	// Observables
	@observable battle = Battle.Stalingrad
	@observable date = ''
	@observable start = Start.Parking
	@observable.ref choice = {}

	// Actions
	@action setBattle = battle => {this.battle = battle}
	@action setDate = date => {this.date = date}
	@action setStart = start => {this.start = start}
	@action setChoice = choice => {this.choice = choice}

	constructor() {

		const {battle, date, start, choice} = remote.getGlobal('config')

		// Load existing create mission state from configuration data

		if (start !== undefined && Object.values(Start).includes(start)) {
			this.start = start
		}

		if (battle !== undefined && Object.values(Battle).includes(battle)) {
			this.battle = battle
		}

		if (typeof date === 'string' && date in this.battles[this.battle].dates) {
			this.date = date
		}

		if (typeof choice === 'object') {
			this.choice = choice
		}

		// Send configuration data to main Electron process
		reaction(
			() => this.config,
			config => {
				ipcRenderer.sendSync('setConfig', config)
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

export default new CreateStore()
