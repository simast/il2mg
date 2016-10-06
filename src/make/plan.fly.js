/** @copyright Simas Toleikis, 2015 */
"use strict";

const {MCU_Icon, MCU_Waypoint} = require("../item");
const {mapColor} = require("../data");
const {markMapArea} = require("./map");

// Make plan fly action
module.exports = function makePlanFly(action, element, flight, input) {

	const leaderElement = flight.elements[0];
	const route = action.route;

	// Proccess fly action only for leading element and with valid route
	if (element !== leaderElement || !Array.isArray(route) || !route.length) {
		return;
	}
	
	const debugFlights = Boolean(this.debug && this.debug.flights);
	const drawIcons = Boolean(action.visible) || debugFlights;
	
	if (!input && !drawIcons) {
		return;
	}
	
	const leaderPlaneItem = element[0].item;
	let lastWaypoint = null;
	
	// Process each route spot
	for (let i = 0; i < route.length; i++) {
		
		let spot = route[i];
		const nextSpot = route[i + 1];
		
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
				lastWaypoint.setOrientationTo(spot.waypoint);
				spot.waypoint.addTarget(waitCounter);
				waitCounter.addTarget(waitTimer);
				
				lastWaypoint = waitTimer;
			}
		}
		// Create waypoint for a non-looping spot
		else if (input && !spot.waypoint) {
			
			const waypoint = spot.waypoint = flight.group.createItem("MCU_Waypoint");
			
			waypoint.addObject(leaderPlaneItem);
			waypoint.setPosition(spot.position);
			
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
				
				if (lastWaypoint instanceof MCU_Waypoint) {
					lastWaypoint.setOrientationTo(waypoint);
				}
			}
			
			lastWaypoint = waypoint;
		}
		
		const isNextSpotVisible = (nextSpot && !nextSpot.hidden);
		
		// Draw flight route on the map
		// NOTE: Only draw icons for visible spots or when the next spot is visible
		// (to allow route line connections).
		if (drawIcons && (!spot.hidden || isNextSpotVisible)) {
			
			const lastSpotIcon = flight.lastSpotIcon || flight.startIcon;
			let spotIcon;
			
			// Reuse already existing icon (from a looping pattern)
			if (spot.icon) {
				spotIcon = spot.icon;
			}
			// Create a new spot icon
			else {
				
				spotIcon = flight.group.createItem("MCU_Icon");
	
				spotIcon.setPosition(spot.position);
				spotIcon.Coalitions = [flight.coalition];
				
				if (!spot.hidden && !spot.split && isNextSpotVisible) {
					spotIcon.IconId = MCU_Icon.ICON_WAYPOINT;
				}
			}
			
			if (!spot.hidden) {
				
				lastSpotIcon.addTarget(spotIcon);
				lastSpotIcon.setColor(mapColor.ROUTE);
				
				// Use solid line
				if (spot.solid && !spot.icon) {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_3;
				}
				// Use dashed line
				else {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_4;
				}
			}
			
			if (spot.end) {
				
				markMapArea.call(this, flight, {
					position: spot.position,
					perfect: true,
					radius: 10000,
					lineType: MCU_Icon.LINE_ZONE_2
				});
				
				// TODO: Implement "end" waypoint logic
			}
			
			flight.lastSpotIcon = spot.icon = spotIcon;
		}
	}
	
	if (!lastWaypoint) {
		return;
	}

	// Connect next plan action with last waypoint
	return (input) => {
		lastWaypoint.addTarget(input);
	};
};