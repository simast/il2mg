/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan land action
module.exports = function makePlanLand(action, element, flight, input) {

	// TODO: Remove/delete flight planes at destination if it's not possible to land
	if (!flight.taxi) {
		return input;
	}
	
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const debugFlights = Boolean(this.debug && this.debug.flights);
	
	// NOTE: Land command will not be generated when player is a flight leader!
	if (isPlayerFlightLeader && !debugFlights) {
		return input;
	}
	
	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const leaderElement = flight.elements[0];
	const leaderPlaneItem = element[0].item;
	const taxiRoute = airfield.taxi[Math.abs(flight.taxi)];
	const landCommand = flight.group.createItem("MCU_CMD_Land");

	// Set land command position and orientation
	// NOTE: Landing point is the same as takeoff
	landCommand.setPosition(taxiRoute.takeoffStart);
	landCommand.setOrientationTo(taxiRoute.takeoffEnd);

	landCommand.addObject(leaderPlaneItem);

	// Leading element land action
	if (element === leaderElement) {

		element.landCommand = landCommand;

		// Connect land command to previous action
		input(landCommand);
	}
	// Other element land action
	else {

		// TODO: Other elements should wait for previous element landed reports

		// Short timer used to delay land command
		const waitTimer = flight.group.createItem("MCU_Timer");

		waitTimer.Time = +(rand.real(10, 15).toFixed(3));
		waitTimer.setPositionNear(leaderPlaneItem); // TODO
		waitTimer.addTarget(landCommand);

		flight.leader.item.entity.addReport(
			"OnLanded",
			leaderElement.landCommand,
			waitTimer
		);
	}
};