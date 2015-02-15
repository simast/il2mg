/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Generate mission flights
module.exports = function(mission) {

	var plane = new Block(Block.PLANE);
	var planeEntity = new Block(Block.ENTITY);

	plane.setName("Ju 87 D-3");
	plane.setIndex();
	plane.setPosition(116317.252, 83.238, 102764.117);
	plane.setOrientation(0, 47.80, 11);
	plane.Script = "luascripts/worldobjects/planes/ju87d3.txt";
	plane.Model = "graphics/planes/ju87d3/ju87d3.mgm";
	plane.Country = 201;
	plane.Skin = "ju87d3/ju-87d-8 njgs italy swastika.dds";
	plane.AILevel = 0;
	plane.CoopStart = 0;
	plane.NumberInFormation = 0;
	plane.Vulnerable = 1;
	plane.Engageable = 1;
	plane.LimitAmmo = 1;
	plane.StartInAir = 2;
	plane.Callsign = 5;
	plane.Callnum = 2;
	plane.Time = 20;
	plane.DamageReport = 50;
	plane.DamageThreshold = 1;
	plane.PayloadId = 4;
	plane.WMMask = 11;
	plane.AiRTBDecision = 1;
	plane.DeleteAfterDeath = 0;
	plane.Fuel = 1;

	planeEntity.setIndex();

	// Link two blocks
	plane.LinkTrId = planeEntity.Index;
	planeEntity.MisObjID = plane.Index;

	mission.blocks.push(plane);
	mission.blocks.push(planeEntity);
};