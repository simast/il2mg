import mustache from 'mustache'

import {data} from '../data'
import {getEnemyCoalition} from './utils'
import people from './people'
import makeBriefingTarget from './briefing.target'

// Default string constants
const PLANE = 'plane'
const FLIGHT = 'flight'

// Plane type names
const planeTypeNames = {
	fighter: 'fighter',
	fighter_heavy: 'heavy fighter',
	ground_attack: 'ground attack ' + PLANE,
	dive_bomber: 'dive bomber',
	level_bomber: 'bomber',
	transport: 'transport ' + PLANE
}

/**
 * Make mission briefing text from a templated string.
 *
 * Supported template tags:
 *
 * 	{{airfield}} - Name of the player flight airfield.
 * 	{{target}} - Player task target location description.
 * 	{{enemy.demonym}} - Name of main enemy country demonym.
 *
 * 	{{{plane}}} - Any player plane name representation.
 * 	{{plane.name}} - Player plane model name.
 * 	{{plane.group}} - Player plane group name.
 * 	{{plane.manufacturer}} - Player plane manufacturer name.
 * 	{{{plane.alias}}} - Player plane alias.
 * 	{{plane.type}} - Player plane type.
 *
 * 	{{name}} - Any full name.
 * 	{{name.first}} - Any first name.
 * 	{{name.last}} - Any last name.
 *
 * 	Rank TYPE values: commander, pilot, leader, liaison, aa, brass
 * 	{{{rank.TYPE}}} - Any TYPE level full rank name.
 * 	{{{rank.TYPE.abbr}}} - Any TYPE level abbreviated rank name.
 *
 * 	{{{formation}}} - Flight formation name.
 * 	{{{formation.element}}} - Player element formation name.
 *
 * @param {string} template Template string to use for rendering.
 * @param {object} [view] Extra template view data.
 * @returns {string} Rendered briefing text.
 */
export default function makeBriefingText(template, view) {

	const rand = this.rand
	const flight = this.player.flight
	let context = flight.context

	// Make a context for briefing templates
	if (!context) {

		context = flight.context = Object.create(null)

		const playerPlane = this.planes[flight.player.plane]
		const playerElement = this.player.element
		const names = data.countries[flight.country].names
		const weightedRanks = this.weightedRanksByCountry[flight.country]

		// Flight home airfield name
		context.airfield = this.airfields[flight.airfield].name

		// Flight target location description
		context.target = makeBriefingTarget.bind(this, flight.target)

		// {{enemy}} template tag
		const enemyTag = context.enemy = Object.create(null)

		// Name of main enemy country demonym
		const enemyDemonym = enemyTag.demonym = Object.create(null)
		enemyDemonym.toString = () => {

			const enemyCoalition = getEnemyCoalition(flight.coalition)
			let enemyCountry

			for (const countryID in data.countries) {

				const country = data.countries[countryID]

				if (country.coalition !== enemyCoalition) {
					continue
				}

				// TODO: Improve main country identification (currently the first
				// matching country present in the battle will be considered as main).
				if (this.unitsByCountry[countryID]) {

					enemyCountry = country
					break
				}
			}

			return enemyCountry.demonym || ''
		}

		// {{{plane}}} template tag
		const planeTag = context.plane = Object.create(null)

		planeTag.name = playerPlane.name
		planeTag.group = this.planes[playerPlane.group].name

		if (playerPlane.manufacturer) {
			planeTag.manufacturer = playerPlane.manufacturer
		}

		if (playerPlane.alias) {
			planeTag.alias = '<i>“' + playerPlane.alias + '”</i>'
		}

		if (playerPlane.type) {

			// Find first matching plane type name
			// NOTE: The order of plane "type" list items is important - the last type is
			// considered to be more important and has a higher value than the first one.
			for (let i = playerPlane.type.length - 1; i >= 0; i--) {

				const planeType = playerPlane.type[i]

				if (planeType in planeTypeNames) {

					planeTag.type = planeTypeNames[planeType]
					break
				}
			}
		}

		// Any player plane name representation
		planeTag.toString = () => {

			const sample = []

			if (planeTag.manufacturer) {
				sample.push(planeTag.manufacturer)
			}

			if (planeTag.group) {
				sample.push(planeTag.group)
			}

			if (planeTag.alias) {
				sample.push(planeTag.alias)
			}

			const result = []

			// Select up to two data sample elements (keeping sort order)
			if (sample.length) {

				rand
					.sample(
						Object.keys(sample),
						rand.integer(1, Math.min(sample.length, 2))
					)
					.sort()
					.forEach(sampleIndex => {
						result.push(sample[sampleIndex])
					})
			}

			// Append plane type
			if (planeTag.type) {
				result.push(planeTag.type)
			}
			// Append a generic "plane" type
			else {
				result.push(PLANE)
			}

			return result.join(' ')
		}

		// {{name}} template tag
		const nameTag = context.name = Object.create(null)

		// Build a list of used names (to avoid repeating/confusing names)
		// NOTE: All name parts are in lower-case!
		let usedNames = this.usedNames

		if (!usedNames) {

			usedNames = this.usedNames = {
				first: new Set(),
				last: new Set()
			}

			// Mark all player flight pilot names as used
			for (let pilotName of this.pilots) {

				pilotName = pilotName.split(' ')

				usedNames.first.add(pilotName[0])
				usedNames.last.add(pilotName[pilotName.length - 1])
			}
		}

		// Any full name
		nameTag.toString = () => {

			let name
			let nameKey

			do {
				name = people.getName(names)
				nameKey = name.last[name.last.length - 1].toLowerCase()
			}
			while (usedNames.last.has(nameKey))

			usedNames.last.add(nameKey)

			let nameParts = []

			for (const namePart in name) {
				nameParts = nameParts.concat(name[namePart])
			}

			return nameParts.join(' ')
		}

		// Any first name
		nameTag.first = () => {

			let first
			let firstKey

			do {
				first = people.getName(names).first
				firstKey = first[0].toLowerCase()
			}
			while (usedNames.first.has(firstKey))

			usedNames.first.add(firstKey)

			first.toString = function() {
				return this[0]
			}

			return first
		}

		// Any last name
		nameTag.last = () => {

			let last
			let lastKey

			do {
				last = people.getName(names).last
				lastKey = last[last.length - 1].toLowerCase()
			}
			while (usedNames.last.has(lastKey))

			usedNames.last.add(lastKey)

			last.toString = function() {
				return this.join(' ')
			}

			return last
		}

		// {{rank}} template tag
		const rankTag = context.rank = Object.create(null)

		// Create tag for each valid rank type
		for (const rankType in weightedRanks) {

			const rankTypeTag = rankTag[rankType] = Object.create(null)

			// Full rank name
			rankTypeTag.toString = function() {

				const rank = people.getRank({type: this}, flight.country)

				if (rank.name) {
					return '<i>' + rank.name + '</i>'
				}

			}.bind(rankType)

			// Abbreviated rank name
			rankTypeTag.abbr = function() {

				const rank = people.getRank({type: this}, flight.country)

				if (rank.abbr) {
					return '<i>' + rank.abbr + '</i>'
				}

			}.bind(rankType)
		}

		// {{{formation}}} template tag
		const formationTag = context.formation = Object.create(null)

		// Flight formation name
		formationTag.toString = () => {

			let formation = FLIGHT

			// Country specific formation name
			if (flight.formation.name) {
				formation = '<i>' + flight.formation.name.toLowerCase() + '</i>'
			}

			return formation
		}

		// Player element formation name
		formationTag.element = () => {

			let formation = FLIGHT

			const playerFormationIndex = flight.elements.indexOf(playerElement)
			const playerFormation = flight.formation.elements[playerFormationIndex]

			// Use element sub-formation
			if (typeof playerFormation !== 'number') {

				const subFormation = this.formations[flight.country][playerFormation]

				if (subFormation && subFormation.name) {
					formation = '<i>' + subFormation.name.toLowerCase() + '</i>'
				}
			}

			return formation
		}
	}

	// With no custom view data
	if (!view) {
		view = context
	}
	// With custom view data
	else {
		Object.setPrototypeOf(view, context)
	}

	// Render template using Mustache
	return mustache.render(template, view).replace(/\s{2,}/g, ' ')
}
