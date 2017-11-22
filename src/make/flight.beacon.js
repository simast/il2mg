// Make flight beacon
export default function makeFlightBeacon(flight) {

	// Enable radio navigation beacon source for player flight only
	if (!flight.player) {
		return
	}

	const airfield = this.airfields[flight.airfield]

	// Use flight home airfield beacon by default
	let beaconItem = airfield.beacon

	// Override with custom flight provided target beacon
	if (flight.beacon) {
		beaconItem = flight.beacon
	}

	if (!beaconItem) {
		return
	}

	beaconItem.BeaconChannel = 1
	beaconItem.entity.Enabled = 1

	// Detach beacon item from airfield "bubble" zone
	if (airfield.zone) {

		airfield.zone.onActivate.removeObject(beaconItem)
		airfield.zone.onDeactivate.removeObject(beaconItem)
	}
}