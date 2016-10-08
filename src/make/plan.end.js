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
	const isPlayerFlightLeader = (flight.player === flight.leader);
	
	// Delete all AI plane items
	if (!isPlayerFlightLeader) {
		
		let onEnd = flight.onEnd;
		
		if (!onEnd && input) {
			
			onEnd = flight.onEnd = flight.group.createItem("MCU_Delete");
			
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
		
		const playerEndRadius = Number(rand.real(
			MIN_PLAYER_END_RADIUS,
			MAX_PLAYER_END_RADIUS,
			true
		).toFixed(Item.PRECISION_POSITION));

		// Mark mission end area with a circle
		markMapArea.call(this, flight, {
			position: action.position,
			perfect: true,
			radius: playerEndRadius,
			lineType: Item.MCU_Icon.LINE_ZONE_2
		});
		
		const endCheckZone = flight.group.createItem("MCU_CheckZone");
		const endMissionItem = flight.group.createItem("MCU_TR_MissionEnd");
		
		// TODO: Activate check zone with a bubble
		flight.onStart.addTarget(endCheckZone);
		
		endCheckZone.Zone = playerEndRadius;
		endCheckZone.setPosition(action.position);
		endCheckZone.addObject(flight.player.item);
		endCheckZone.addTarget(endMissionItem);
		
		endMissionItem.Succeeded = 0; // 0 = Succeeded
		endMissionItem.setPositionNear(endCheckZone);
	}
};