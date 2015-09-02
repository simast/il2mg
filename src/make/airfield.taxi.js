/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var itemFlag = DATA.itemFlag;

// Make airfield taxi route
module.exports = function makeAirfieldTaxi(airfield, taxiRouteID) {

	// TODO: Invert taxi points based on takeoff against the wind requirements

	taxiRouteID = parseInt(taxiRouteID, 10);

	if (!airfield.taxi || !airfield.taxi[taxiRouteID]) {
		return false;
	}
	
	var taxiRoute = airfield.taxi[taxiRouteID];
	var runwayID = taxiRoute[1];
	var activeTaxiRoutes = airfield.activeTaxiRoutes;

	if (!activeTaxiRoutes) {
		activeTaxiRoutes = airfield.activeTaxiRoutes = Object.create(null);
	}

	// Limit 1 taxi route per runway (due to AI issues)
	if (activeTaxiRoutes[runwayID] !== undefined) {
		return (activeTaxiRoutes[runwayID] === taxiRouteID);
	}

	var itemType = DATA.getItemType(taxiRoute[0]);
	var isInvertible = (taxiRoute[2] === itemFlag.TAXI_INV);
	var basePoint = taxiRoute[3];
	
	// Set unique airfield callsign
	if (!airfield.callsign) {
		
		airfield.callsign = this.getCallsign("airfield");

		// Make sure the callsign used for player home airfield is unique
		if (this.player.flight) {
			
			var playerAirfield = this.airfields[this.player.flight.airfield];
	
			if (airfield.id !== playerAirfield.id) {
				
				while (airfield.callsign.id === playerAirfield.callsign.id) {
					airfield.callsign = this.getCallsign("airfield");
				}
			}
		}
	}

	// Create airfield item
	var airfieldItem = airfield.group.createItem(itemType.type);

	airfieldItem.Model = itemType.model;
	airfieldItem.Script = itemType.script;
	airfieldItem.setPosition(basePoint[0], airfield.position[1], basePoint[1]);
	airfieldItem.setOrientation(basePoint[2]);
	airfieldItem.Country = airfield.country;
	airfieldItem.Callsign = airfield.callsign.id;

	var taxiPoints = taxiRoute[4];

	// Invert taxi points based on shortest distance to runway
	if (isInvertible) {

		(function() {

			var isForward = true;
			var distanceForward = 0;
			var distanceBackward = 0;
			var lastPoint = taxiPoints[0];
			
			// Compute forward and backward distances
			for (var i = 1; i < taxiPoints.length; i++) {
				
				var point = taxiPoints[i];
				
				var distance = Math.sqrt(
					Math.pow(lastPoint[0] - point[0], 2) + Math.pow(lastPoint[1] - point[1], 2)
				);
				
				if (isForward) {
					distanceForward += distance;
				}
				else {
					distanceBackward += distance;
				}
				
				// Switch to backward distance on runway point type
				if (point[2] === itemFlag.TAXI_RUNWAY) {
					
					isForward = false;
					i++; // Skip next runway point
				}
				
				lastPoint = taxiPoints[i];
			}

			// Reverse taxi point list
			if (distanceForward > distanceBackward) {
				taxiPoints.reverse();
			}
		
		})();
	}
	
	var chartItem = new Item("Chart");
	var firstPoint = taxiPoints[0];
	var lastPoint = taxiPoints[taxiPoints.length - 1];

	// Create airfield taxi route Chart->Point list
	for (var i = 0; i < taxiPoints.length; i++) {

		var point = taxiPoints[i];
		var pointItem = new Item("Point");
		var pointType = 1; // Taxi point type

		// Parking point type
		if (point === firstPoint || point === lastPoint) {
			pointType = 0;
		}
		// Runway point type
		else if (point[2] === itemFlag.TAXI_RUNWAY) {

			pointType = 2;

			// Index takeoff point start position
			if (!taxiRoute.takeoffStart) {
				taxiRoute.takeoffStart = [point[0], airfield.position[1], point[1]];
			}
			// Index takeoff point end position
			else if (!taxiRoute.takeoffEnd) {
				taxiRoute.takeoffEnd = [point[0], airfield.position[1], point[1]];
			}
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

	// Set active taxi route for runway
	activeTaxiRoutes[runwayID] = taxiRouteID;
	
	return true;
};