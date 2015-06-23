/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make plan land action
module.exports = function makePlanLand(action, element, flight, input) {

	// TODO: Remove/delete flight planes at destination if it's not possible to land
	if (!flight.taxi) {
		return;
	}
	
	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];
	var leaderElement = flight.elements[0];
	var leaderPlaneItem = element[0].item;
	var landCommand = flight.group.createItem("MCU_CMD_Land");

	// NOTE: Landing point is the same as takeoff
	var takeoffStart = airfield.taxi[flight.taxi].takeoffStart;
	var takeoffEnd = airfield.taxi[flight.taxi].takeoffEnd;

	// Set land command position and orientation
	landCommand.setPosition(takeoffStart);
	landCommand.setOrientationTo(takeoffEnd);

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
		var waitTimer = flight.group.createItem("MCU_Timer");

		waitTimer.Time = rand.real(10, 15);
		waitTimer.setPositionNear(leaderPlaneItem); // TODO
		waitTimer.addTarget(landCommand);

		flight.leader.item.entity.addReport(
			"OnLanded",
			leaderElement.landCommand,
			waitTimer
		);
	}
};