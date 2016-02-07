/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const MCU_Icon = require("../item").MCU_Icon;

// Data constants
const mapColor = data.mapColor;

// Make plan fly action
module.exports = function makePlanFly(action, element, flight, input) {

	const leaderElement = flight.elements[0];

	// Proccess fly action only for leading element
	if (element !== leaderElement) {
		return;
	}
	
	const route = action.route;
	const leaderPlaneItem = element[0].item;
	let lastWaypoint = null;
	
	for (const spot of route) {
		
		const isLastSpot = (spot === route[route.length - 1]);
		const waypoint = flight.group.createItem("MCU_Waypoint");
		
		waypoint.addObject(leaderPlaneItem);
		waypoint.setPosition(spot.point);
		
		// TODO:
		waypoint.Speed = spot.speed;
		waypoint.Area = 1000;
		
		if (spot.priority !== undefined) {
			waypoint.Priority = spot.priority;
		}
		
		// Connect initial (first) waypoint with previous action
		// TODO: Leading element should wait for other elements
		if (!lastWaypoint) {
			input(waypoint);
		}
		// Connect this waypoint to last waypoint
		else {
			lastWaypoint.addTarget(waypoint);
		}
		
		lastWaypoint = waypoint;
		
		// Draw flight route on the map for a player flight
		// TODO: Draw only when player is not a flight leader
		if (flight.player) {
			
			const lastSpotIcon = flight.lastSpotIcon || flight.startIcon;
			let spotIcon;
			
			// Reuse starting icon for last home return (egress) spot
			if (spot.egress && isLastSpot) {
				spotIcon = flight.startIcon;
			}
			// Create a new spot icon
			else {
				
				spotIcon = flight.group.createItem("MCU_Icon");
	
				spotIcon.setPosition(spot.point);
				spotIcon.Coalitions = [flight.coalition];
				spotIcon.IconId = MCU_Icon.ICON_WAYPOINT;
			}
			
			if (!spot.hidden) {
				
				lastSpotIcon.addTarget(spotIcon);
				lastSpotIcon.setColor(mapColor.ROUTE);
				
				// Use dashed line for return egress route
				if (spot.egress) {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_4;
				}
				// Use normal solid route line
				else {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_3;
				}
			}
			
			flight.lastSpotIcon = spotIcon;
		}
	}

	// Connect next plan action with last waypoint
	return function(input) {
		lastWaypoint.addTarget(input);
	};
};