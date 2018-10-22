import {log} from '../log'
import {makeForce} from './forces'

// Make player task force
export default function makePlayerForce() {

	const {choice, params} = this

	// Create player task force
	const force = makeForce.call(this, {
		player: true,
		choice,
		state: params.state
	})

	const [flight] = force

	// Set player flight info references
	const player = this.player = Object.create(null)

	player.force = force
	player.flight = flight
	player.plane = flight.player.plane
	player.item = flight.player.item

	// Find player element
	for (const element of flight.elements) {

		if (element.player) {

			player.element = element
			break
		}
	}

	// Log player flight info
	const logData = ['Flight:']

	// Log flight unit name
	const unit = this.units[player.flight.unit]
	let unitName = unit.name

	if (unit.suffix) {
		unitName += ' ' + unit.suffix
	}

	if (unit.alias) {
		unitName += ' “' + unit.alias + '”'
	}

	logData.push(unitName)

	// Log flight formation and state (for player element)
	const formation = player.flight.formation
	let formationID = formation.id

	if (!formationID) {
		formationID = formation.elements.join(':')
	}

	logData.push({
		formation: formationID,
		state: player.element.state
	})

	log.I.apply(log, logData)
}
