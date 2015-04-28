/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var itemFlag = require("./airfields").itemFlag;

// Make airfield taxi route
module.exports = function makeAirfieldTaxi(airfield, taxiRouteID) {

	if (!airfield.taxi || !airfield.taxi[taxiRouteID]) {
		return;
	}
	
	// TODO: Limit 1 taxi route per runway (due to AI issues)

	var taxiRoute = airfield.taxi[taxiRouteID];
	var itemType = this.data.getItemType(taxiRoute[0]);
	var runwayID = taxiRoute[1];
	var isInvertible = (taxiRoute[2] === itemFlag.TAXI_INV);
	var basePoint = taxiRoute[3];

	// Create airfield item
	var airfieldItem = airfield.group.createItem(itemType.type);

	airfieldItem.Model = itemType.model;
	airfieldItem.Script = itemType.script;
	airfieldItem.setPosition(basePoint[0], airfield.position[1], basePoint[1]);
	airfieldItem.setOrientation(basePoint[2]);
	airfieldItem.Country = airfield.country;

	if (airfield.callsign) {
		airfieldItem.Callsign = airfield.callsign[0];
	}

	var chartItem = new Item("Chart");
	var firstPointIndex = 4;
	var firstPoint = taxiRoute[firstPointIndex];
	var lastPoint = taxiRoute[taxiRoute.length - 1];

	// Create airfield taxi route Chart->Point list
	for (var i = firstPointIndex; i < taxiRoute.length; i++) {

		var point = taxiRoute[i];
		var pointItem = new Item("Point");
		var pointType = 1; // Taxi point type

		// Parking point type
		if (point === firstPoint || point === lastPoint) {
			pointType = 0;
		}
		// Runway point type
		else if (point[2] === itemFlag.TAXI_RUNWAY) {
			pointType = 2;
		}

		// Convert absolute taxi point coordinates to relative vector X/Y offsets
		var pointXDiff = point[0] - basePoint[0];
		var pointYDiff = point[1] - basePoint[1];
		var pointTheta = -basePoint[2] * (Math.PI / 180);
		var pointX = pointXDiff * Math.cos(pointTheta) - pointYDiff * Math.sin(pointTheta);
		var pointY = pointXDiff * Math.sin(pointTheta) + pointYDiff * Math.cos(pointTheta);

		pointItem.Type = pointType;
		pointItem.X = Number(pointX.toFixed(Item.PRECISION_POSITION));
		pointItem.Y = Number(pointY.toFixed(Item.PRECISION_POSITION));

		chartItem.addItem(pointItem);
	}

	airfieldItem.addItem(chartItem);
	airfieldItem.createEntity();
};