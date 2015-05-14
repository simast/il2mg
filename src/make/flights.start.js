/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission flight start logic
module.exports = function makeFlightStart(flight) {

	// No takeoff command for player-only taxi route (or flight from air start)
	if (!flight.taxi) {
		return;
	}

	// TODO: Set fuel

	var rand = this.rand;
	var airfield = this.airfieldsByID[flight.airfield];

	for (var element of flight.elements) {
		
		// Set element air start
		if (typeof element.state !== "string") {

			var orientation = rand.integer(0, 360);

			for (var plane of element) {

				var planeItem = plane.item;

				// TODO: Set orientation and tweak spawn distance
				// TODO: Set formation?
				var positionX = airfield.position[0] + rand.integer(150, 350);
				var positionY = airfield.position[1] + rand.integer(250, 350);
				var positionZ = airfield.position[2] + rand.integer(150, 350);

				// Set plane item air start position and orientation
				planeItem.setPosition(positionX, positionY, positionZ);
				planeItem.setOrientation(orientation);
			}

			continue;
		}

		var missionBegin = flight.group.createItem("MCU_TR_MissionBegin");
		var takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");
	
		missionBegin.setPositionNear(element[0].item);
		missionBegin.addTarget(takeoffCommand);

		takeoffCommand.setPositionNear(missionBegin);
		takeoffCommand.setPosition(
			takeoffCommand.XPos,
			takeoffCommand.YPos + 500,
			takeoffCommand.ZPos
		);
		
		takeoffCommand.addObject(element[0].item);
	}
};