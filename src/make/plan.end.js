/** @copyright Simas Toleikis, 2016 */
"use strict";

const Item = require("../item");
const {markMapArea} = require("./map");

// Min/max radius of the "mission end" circle (used with player flight only)
const MIN_PLAYER_END_RADIUS = 9500; // 9.5 km
const MAX_PLAYER_END_RADIUS = 10500; // 10.5 km

// Make plan end action
// NOTE: Most flights will end naturally with a "land" action - this special
// end flight action is only used for rare situations - like ending the flight
// prematurely on a route to an offmap airfield, for example.
module.exports = function makePlanEnd(action, element, flight, input) {

	const rand = this.rand;
	const flightGroup = flight.group;
	const isPlayerFlightLeader = (flight.player === flight.leader);

	// Delete all AI plane items
	if (!isPlayerFlightLeader) {

		let onEnd = flight.onEnd;

		if (!onEnd && input) {

			onEnd = flight.onEnd = flightGroup.createItem("MCU_Delete");

			onEnd.setPosition(action.position);
			input(onEnd);
		}

		if (onEnd) {

			for (const {item: planeItem} of element) {

				if (planeItem !== flight.player.item) {
					onEnd.addObject(planeItem);
				}
			}
		}
	}

	// Use a separate marked check zone area for ending player mission
	if (element.player) {

		const airfield = this.airfields[flight.airfield];
		const playerEndRadius = Number(rand.real(
			MIN_PLAYER_END_RADIUS,
			MAX_PLAYER_END_RADIUS,
			true
		).toFixed(Item.PRECISION_POSITION));

		// Mark mission end area with a circle
		const markIcons = markMapArea.call(this, flight, {
			position: action.position,
			perfect: true,
			radius: playerEndRadius,
			lineType: Item.MCU_Icon.LINE_ZONE_2
		});

		const endCheckZone = flightGroup.createItem("MCU_CheckZone");
		const endMissionItem = flightGroup.createItem("MCU_TR_MissionEnd");

		endCheckZone.Zone = playerEndRadius;
		endCheckZone.setPosition(action.position);
		endCheckZone.addObject(flight.player.item);
		endCheckZone.addTarget(endMissionItem);

		endMissionItem.Succeeded = 0; // 0 = Succeeded
		endMissionItem.setPositionNear(endCheckZone);

		let endTarget = endCheckZone;

		// Activate end check zone with another "further" check zone when flying
		// from offmap airfields. This is a workaround for when both entry and exit
		// offmap route points might be inside the check zone area.
		if (airfield.offmap) {

			const endGuardTimer = flightGroup.createItem("MCU_Timer");
			const endGuardCheckZone = flightGroup.createItem("MCU_CheckZone");
			const endGuardActivate = flightGroup.createItem("MCU_Activate");
			const endGuardDeactivate = flightGroup.createItem("MCU_Deactivate");

			// Further (guard) activation check zone is +50% larger
			let endGuardZone = Number(playerEndRadius * 1.5);
			endGuardZone = endGuardZone.toFixed(Item.PRECISION_POSITION);

			endGuardCheckZone.Zone = endGuardZone;
			endGuardCheckZone.Closer = 0; // Further
			endGuardCheckZone.setPosition(action.position);
			endGuardCheckZone.addObject(flight.player.item);
			endGuardCheckZone.addTarget(endTarget);
			endGuardCheckZone.addTarget(endGuardActivate);
			endGuardCheckZone.addTarget(endGuardDeactivate);

			endGuardActivate.setPositionNear(endGuardCheckZone);
			endGuardDeactivate.setPositionNear(endGuardCheckZone);
			endGuardDeactivate.addTarget(endGuardCheckZone);

			// Activate mission map end area circle together with the check zone
			for (const markIcon of markIcons) {

				markIcon.Enabled = 0;
				endGuardActivate.addTarget(markIcon);
			}

			// NOTE: Need an extra timer as "further" check zone does not work
			// correctly when activated directly by Mission Begin MCU.
			endGuardTimer.Time = Number(rand.real(5, 8).toFixed(3));
			endGuardTimer.addTarget(endGuardCheckZone);
			endGuardTimer.setPositionNear(endGuardCheckZone);

			endTarget = endGuardTimer;
		}

		// TODO: Activate check zone with a bubble
		flight.onStart.addTarget(endTarget);
	}
};