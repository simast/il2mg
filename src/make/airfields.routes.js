/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var makeAirfieldVehicle = require("./airfields.vehicle");
var itemTag = DATA.itemTag;
var itemFlag = DATA.itemFlag;

// Make airfield vehicle routes
module.exports = function makeAirfieldRoutes(airfield, routes) {

	if (!airfield.value || !airfield.country || !routes || !routes.length) {
		return;
	}

	var rand = this.rand;

	rand.shuffle(routes);

	while (--airfield.limits.routes >= 0 && routes.length) {

		// Weighted vehicle pool (chance) array
		var vehiclePool = rand.shuffle([
			itemTag.TRUCK_CARGO,
			itemTag.TRUCK_CARGO,
			itemTag.TRUCK_CARGO,
			itemTag.CAR
		]);

		var vehicle = null;

		// Create a live vehicle item object for this route
		while (vehiclePool.length && !vehicle) {

			vehicle = makeAirfieldVehicle.call(this, airfield, [
				vehiclePool.shift(),
				airfield.position[0],
				airfield.position[1],
				airfield.position[2],
				0
			], true);

			if (Array.isArray(vehicle)) {
				vehicle = vehicle[0];
			}
		}

		// Most likely a result of airfield vehicle limits
		if (!vehicle) {
			continue;
		}

		var route = routes.shift();
		var routeGroup = airfield.group.createItem("Group");
		var waypointVehicle = rand.integer(0, route.length - 1);
		var waypointFirst = null;
		var waypointLast = null;
		var isRoadFormation = false; // Default is offroad formation

		routeGroup.setName(vehicle.Name);
		routeGroup.addItem(vehicle);

		// 50% chance to reverse/invert the route
		if (rand.bool()) {
			route.reverse();
		}

		// Create route waypoints
		for (var w = 0; w < route.length; w++) {

			var item = route[w];
			var itemNext = route[w + 1] || route[0];
			var itemPrev = route[w - 1] || route[route.length - 1];
			var isStop = (item[2] === itemFlag.ROUTE_STOP);
			var isRoad = (item[2] === itemFlag.ROUTE_ROAD);
			var isRoadNext = (itemNext[2] === itemFlag.ROUTE_ROAD);
			var isRoadPrev = (itemPrev[2] === itemFlag.ROUTE_ROAD);

			// Create waypoint MCU item
			var waypoint = routeGroup.createItem("MCU_Waypoint");

			if (waypointLast) {
				waypointLast.addTarget(waypoint);
			}
			else {
				waypointFirst = waypoint;
			}

			waypoint.addObject(vehicle);
			waypoint.setPosition(item[0], airfield.position[1], item[1]);

			// Set waypoint orientation (to the direction of next waypoint)
			waypoint.setOrientationTo(itemNext[0], itemNext[1]);

			// Compute waypoint speed
			var distance = Math.sqrt(Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2));

			// Waypoint distance where speed is maximum
			var distanceMax = 180;

			// Offroad speed limits
			var speedMin = 25;
			var speedMax = 45;

			// Onroad speed limits
			if (isRoad && isRoadPrev) {
				speedMin = 40;
				speedMax = 65;
			}

			var speed = (distance / distanceMax) * speedMax;

			speed = Math.max(speed, speedMin);
			speed = Math.min(speed, speedMax);

			// A bit of randomness
			speed += rand.real(-3, 3);

			waypoint.Speed = Math.round(speed);

			// Compute waypoint area
			var b = Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2);
			var a = Math.pow(item[0] - itemNext[0], 2) + Math.pow(item[1] - itemNext[1], 2);
			var c = Math.pow(itemNext[0] - itemPrev[0], 2) + Math.pow(itemNext[1] - itemPrev[1], 2);

			var angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b));
			var angleDiff = Math.abs(angle * (180 / Math.PI) - 180);
			var area = angleDiff / 180 * 40;

			// Waypoint area radius limits (from 10 to 20 meters)
			area = Math.min(Math.max(area, 10), 20);

			waypoint.Area = Math.round(area);
			waypoint.Priority = Item.MCU_Waypoint.PRIORITY_LOW;

			waypointLast = waypoint;

			// Create a random stop waypoint timer
			if (isStop) {

				var stopTimer = routeGroup.createItem("MCU_Timer");

				stopTimer.Time = Number(rand.real(20, 60).toFixed(3));
				stopTimer.setPositionNear(waypoint);

				waypoint.addTarget(stopTimer);

				waypointLast = stopTimer;
			}

			var formation = null;

			// Road vehicle formation
			if (isRoad && !isRoadFormation) {

				formation = Item.MCU_CMD_Formation.TYPE_VEHICLE_COLUMN_ROAD;
				isRoadFormation = true;
			}
			// Offroad vehicle formation
			else if ((!isRoad && isRoadFormation) || (isRoad && !isRoadNext)) {

				formation = Item.MCU_CMD_Formation.TYPE_VEHICLE_COLUMN;
				isRoadFormation = false;
			}

			// Create formation command item
			if (formation !== null) {

				var formationCommand = routeGroup.createItem("MCU_CMD_Formation");

				formationCommand.FormationType = formation;
				formationCommand.addObject(vehicle);
				formationCommand.setPositionNear(waypoint);

				waypoint.addTarget(formationCommand);
			}

			// 25% chance to use each stop waypoint as vehicle starting point
			if (isStop && rand.bool(0.25)) {
				waypointVehicle = waypoint;
			}

			// Set random/assigned vehicle waypoint
			if (waypointVehicle === w) {
				waypointVehicle = waypoint;
			}
		}

		// Link last waypoint to the first (creating a loop)
		waypointLast.addTarget(waypointFirst);

		// Set vehicle position/orientation to starting waypoint
		vehicle.setPosition(waypointVehicle.XPos, waypointVehicle.YPos, waypointVehicle.ZPos);
		vehicle.setOrientation((vehicle.YOri + waypointVehicle.YOri) % 360);

		airfield.onLoad.addTarget(waypointVehicle);
	}
};