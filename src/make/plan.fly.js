/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const MCU_Icon = require("../item").MCU_Icon;

// Data constants
const mapColor = data.mapColor;

// Make plan fly action
module.exports = function makePlanFly(action, element, flight, input) {

	const leaderElement = flight.elements[0];
	const route = action.route;

	// Proccess fly action only for leading element and with valid route
	if (element !== leaderElement || !Array.isArray(route) || !route.length) {
		return;
	}
	
	const leaderPlaneItem = element[0].item;
	const debugFlights = Boolean(this.debug && this.debug.flights);
	let lastWaypoint = null;
	let drawIcons = Boolean(action.draw) || debugFlights;
	
	for (let spot of route) {
		
		// Support for special flight route loop pattern marker
		if (Array.isArray(spot)) {
			
			const loopSpotIndex = spot[0];
			const loopTime = spot[1];
			
			spot = route[loopSpotIndex];
			
			if (input) {
			
				// NOTE: Using a counter to make sure loop timer is activated only once!
				const waitCounter = flight.group.createItem("MCU_Counter");
				const waitTimer = flight.group.createItem("MCU_Timer");
				
				waitTimer.Time = loopTime;
				waitCounter.setPositionNear(spot.waypoint);
				waitTimer.setPositionNear(waitCounter);
				
				lastWaypoint.addTarget(spot.waypoint);
				spot.waypoint.addTarget(waitCounter);
				waitCounter.addTarget(waitTimer);
				
				lastWaypoint = waitTimer;
			}
		}
		// Create waypoint for a non-looping spot
		else if (input && !spot.waypoint) {
			
			const waypoint = spot.waypoint = flight.group.createItem("MCU_Waypoint");
			
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
		}
		
		// Draw flight route on the map
		if (drawIcons && !spot.hidden) {
			
			const isFinalSpot = (spot === route[route.length - 1]);
			const lastSpotIcon = flight.lastSpotIcon || flight.startIcon;
			let spotIcon;
			
			// Reuse already existing icon (from a looping pattern)
			if (spot.icon) {
				spotIcon = spot.icon;
			}
			// Reuse starting icon for last home return (egress) spot
			else if (spot.egress && isFinalSpot) {
				spotIcon = flight.startIcon;
			}
			// Create a new spot icon
			else {
				
				spotIcon = flight.group.createItem("MCU_Icon");
	
				spotIcon.setPosition(spot.point);
				spotIcon.Coalitions = [flight.coalition];
				spotIcon.IconId = MCU_Icon.ICON_WAYPOINT;
			}
			
			lastSpotIcon.addTarget(spotIcon);
			lastSpotIcon.setColor(mapColor.ROUTE);
			
			// Use normal solid line for ingress route
			if (spot.ingress && !spot.icon) {
				lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_3;
			}
			// Use dashed line for other routes
			else {
				lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_4;
			}
			
			flight.lastSpotIcon = spot.icon = spotIcon;
		}
	}
	
	if (!input) {
		return;
	}

	// Connect next plan action with last waypoint
	return function(input) {
		lastWaypoint.addTarget(input);
	};
};