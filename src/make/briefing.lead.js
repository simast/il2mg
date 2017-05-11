/** @copyright Simas Toleikis, 2016 */
"use strict"

const makeBriefingText = require("./briefing.text")

// Make briefing lead text segment for fly routes
module.exports = function makeBriefingLead(flight) {

	const playerElement = this.player.element
	const isPlayerInLeadingElement = (playerElement === flight.elements[0])
	const isPlayerFlightLeader = (flight.player === flight.leader)
	let isPlayerElementLeader = false

	if (playerElement.length > 1 && flight.player === this.player.element[0]) {
		isPlayerElementLeader = true
	}

	let briefingLead = []

	// Make flight lead segment
	if (flight.planes > 1) {

		// Use flight formation name when player is a flight leader
		if (isPlayerFlightLeader) {
			briefingLead.push("lead your {{{formation}}}")
		}
		// Use element sub-formation name when player is an element leader
		else if (isPlayerElementLeader) {

			const flightLeaderID = flight.leader.pilot.id

			briefingLead.push("lead your {{{formation.element}}}")
			briefingLead.push("cover your {{{formation}}} leader " + flightLeaderID)
		}
		// Link to AI element leader
		else if (!isPlayerInLeadingElement && playerElement.length > 1) {

			const elementLeaderID = playerElement[0].pilot.id

			briefingLead.push("follow your {{{formation.element}}} leader " + elementLeaderID)
			briefingLead.push("cover your {{{formation}}}")
		}
		// Link to AI flight leader
		else {

			const flightLeaderID = flight.leader.pilot.id
			briefingLead.push("follow your {{{formation}}} leader " + flightLeaderID)
		}

		briefingLead = briefingLead.map(value => makeBriefingText.call(this, value))
	}

	return briefingLead
}