/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission flights
module.exports = function makeFlights() {

	var plane = this.createItem("Plane");

	plane.setName("Ju 87 D-3");
	plane.setPosition(116323.32, 83.238, 102809.66);
	plane.setOrientation(0, 47.80, 11);
	plane.Script = "luascripts/worldobjects/planes/ju87d3.txt";
	plane.Model = "graphics/planes/ju87d3/ju87d3.mgm";
	plane.Country = 201;
	plane.Skin = "ju87d3/stabi-sg5.dds";
	plane.AILevel = Item.Plane.AI_PLAYER;
	plane.StartInAir = Item.Plane.START_PARKING;
	plane.Callsign = 6;
	plane.Callnum = 2;
	plane.PayloadId = 4;
	plane.WMMask = 0;
	plane.Fuel = 1;

	// Create plane entity
	plane.createEntity();
};