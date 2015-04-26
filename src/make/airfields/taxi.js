/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");
var itemFlags = require("./").itemFlags;

// Make airfield taxi route
module.exports = function makeAirfieldTaxi(airfield, taxiRouteID) {

	if (!airfield.taxi || !airfield.taxi[taxiRouteID]) {
		return;
	}

	var taxiRoute = airfield.taxi[taxiRouteID];
	var runwayID = taxiRoute[0];
	var isInvertible = (taxiRoute[1] === itemFlags.TAXI_INV);
	var basePoint = taxiRoute[2];

	// Create airfield item
	var airfieldItem = airfield.group.createItem("Airfield");

	airfieldItem.setName(airfield.name);
	airfieldItem.setPosition(basePoint[0], airfield.position[1], basePoint[1]);
	airfieldItem.setOrientation(basePoint[2]);
	airfieldItem.Country = airfield.country;

	var chartItem = new Item("Chart");
	var firstPoint = taxiRoute[3];
	var lastPoint = taxiRoute[taxiRoute.length - 1];

	for (var i = 3; i < taxiRoute.length; i++) {

		var point = taxiRoute[i];
		var pointItem = new Item("Point");
		var pointType = 1; // Taxi point type

		// Parking point type
		if (point === firstPoint || point === lastPoint) {
			pointType = 0;
		}
		// Runway point type
		else if (point[2] === itemFlags.TAXI_RUNWAY) {
			pointType = 2;
		}

		var pointXDiff = point[0] - basePoint[0];
		var pointYDiff = point[1] - basePoint[1];
		var pointTheta = -basePoint[2] * (Math.PI / 180);
		var pointX = pointXDiff * Math.cos(pointTheta) - pointYDiff * Math.sin(pointTheta);
		var pointY = pointXDiff * Math.sin(pointTheta) + pointYDiff * Math.cos(pointTheta);

		pointItem.Type = pointType;
		pointItem.X = Number(pointX.toFixed(2));
		pointItem.Y = Number(pointY.toFixed(2));

		chartItem.addItem(pointItem);
	}

	airfieldItem.addItem(chartItem);
	airfieldItem.createEntity();
};