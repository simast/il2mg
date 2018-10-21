import path from 'path'

import log from '../log'
import {DEFAULT_COALITION, DEFAULT_COUNTRY} from '../items/constants'
import data from '../data'
import {APPLICATION_NAME, APPLICATION_VERSION} from '../constants'

// Generate mission battle info
export default function makeBattle() {

	const params = this.params
	let battleID = params.battle

	// Select random battle
	if (!battleID) {
		battleID = this.rand.pick(Object.keys(data.battles))
	}

	this.battleID = battleID
	this.battlePath = path.join('battles', battleID)

	const battle = this.battle = data.battles[battleID]
	const coalitions = this.coalitions = []

	// Load battle index database
	const index = this.index = data.load(this.battlePath)

	// Create main mission Options item
	const options = this.createItem('Options')

	options.LCAuthor = this.getLC(APPLICATION_NAME + ' r' + APPLICATION_VERSION)
	options.MissionType = 0 // Single-player mission

	// Set country:coalition list
	options.Countries = (() => {

		const countries = Object.create(null)

		// Unknown (neutral) country and coalition
		coalitions.push(DEFAULT_COALITION)
		countries[DEFAULT_COUNTRY] = DEFAULT_COALITION

		battle.countries.forEach(countryID => {

			// Support for "alias" (hidden) countries
			countryID = data.countries[countryID].alias || countryID

			const country = data.countries[countryID]
			const coalitionID = country.coalition

			if (coalitions.indexOf(coalitionID) === -1) {
				coalitions.push(coalitionID)
			}

			countries[countryID] = coalitionID
		})

		return Object.keys(countries).map(countryID => (
			[countryID, countries[countryID]]
		))
	})()

	// Set PlayerConfig property to selected player plane item
	this.make.push(() => {
		options.PlayerConfig = this.player.item.Script
	})

	// Save "Options" mission item reference
	this.items.Options = options

	// Log mission battle
	log.I('Battle:', battle.name, {days: Object.keys(index.dates).length})
}
