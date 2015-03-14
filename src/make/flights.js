/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Generate mission flights
module.exports = function(mission, data) {

	var plane = new Item.Plane();

	plane.setName("Ju 87 D-3");
	plane.setPosition(116323.32, 83.238, 102809.66);
	plane.setOrientation(0, 47.80, 11);
	plane.Script = "luascripts/worldobjects/planes/ju87d3.txt";
	plane.Model = "graphics/planes/ju87d3/ju87d3.mgm";
	plane.Country = 201;
	plane.Skin = "ju87d3/ju-87d-8 njgs italy swastika.dds";
	plane.AILevel = 0;
	plane.StartInAir = 2;
	plane.Callsign = 6;
	plane.Callnum = 2;
	plane.PayloadId = 4;
	plane.WMMask = 0;
	plane.Fuel = 1;

	// Create plane entity
	plane.createEntity();

	mission.addItem(plane);
};