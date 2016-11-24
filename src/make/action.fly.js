/** @copyright Simas Toleikis, 2015 */
"use strict";

const {MCU_Icon, MCU_Waypoint} = require("../item");
const {mapColor} = require("../data");

// Make plan fly action
module.exports = function makePlanFlyAction(flight, element, action, input) {

	const leaderElement = flight.elements[0];
	const route = action.route;

	// Proccess fly action only for leading element
	if (element !== leaderElement) {
		return;
	}

	const debugFlights = Boolean(this.debug && this.debug.flights);
	const drawIcons = Boolean(action.visible) || debugFlights;

	if (!input && !drawIcons) {
		return;
	}

	const rand = this.rand;
	const leaderPlaneItem = element[0].item;
	let lastWaypoint = null;

	// Process each route spot
	for (let i = 0; i < route.length; i++) {

		const spot = route[i];
		const nextSpot = route[i + 1];

		// Create waypoint for spot
		if (input) {

			const waypoint = flight.group.createItem("MCU_Waypoint");

			waypoint.addObject(leaderPlaneItem);
			waypoint.setPosition(spot.position);

			waypoint.Speed = spot.speed;
			waypoint.Area = rand.integer(750, 1250);

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
		const drawAIRoute = Boolean(!flight.player && debugFlights);

		// Draw flight route on the map
		// NOTE: Only draw icons for visible spots or when the next spot is visible
		// (to allow route line connections).
		if (drawIcons && (!spot.hidden || isNextSpotVisible)) {

			const lastSpotIcon = flight.lastSpotIcon || flight.startIcon;
			const spotIcon = flight.group.createItem("MCU_Icon");
			let routeColor = mapColor.ROUTE;

			if (drawAIRoute) {

				if (flight.coalition === this.player.flight.coalition) {
					routeColor = mapColor.FRIEND;
				}
				else {
					routeColor = mapColor.ENEMY;
				}
			}

			spotIcon.setPosition(spot.position);
			spotIcon.Coalitions = debugFlights ? this.coalitions : [flight.coalition];

			if (!spot.hidden && !spot.split && isNextSpotVisible && !drawAIRoute) {
				spotIcon.IconId = MCU_Icon.ICON_WAYPOINT;
			}

			if (!spot.hidden) {

				lastSpotIcon.addTarget(spotIcon);
				lastSpotIcon.setColor(routeColor);

				// Use normal lines for AI flight routes in debug mode
				if (drawAIRoute) {
					lastSpotIcon.LineType = MCU_Icon.LINE_NORMAL;
				}
				// Use solid line
				else if (spot.solid) {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_3;
				}
				// Use dashed line
				else {
					lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_4;
				}
			}

			flight.lastSpotIcon = spotIcon;
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