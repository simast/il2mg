/** @copyright Simas Toleikis, 2014 */
"use strict";

var Block = require("../block");

// Generate mission flights
module.exports = function(mission) {

	var planeObject = new Block("Plane");
	var planeEntity = new Block("MCU_TR_Entity");

	planeObject.setName("Ju 87 D-3");
	planeObject.setIndex();
	planeObject.setPosition(132637.484, 0, 186113.266);
	planeObject.setOrientation(0, 164, 0);
	planeObject.Script = "luascripts/worldobjects/planes/ju87d3.txt";
	planeObject.Model = "graphics/planes/ju87d3/ju87d3.mgm";
	planeObject.Country = 201;
	planeObject.Skin = "ju87d3/ju-87d-8 njgs italy swastika.dds";
	planeObject.AILevel = 5;
	planeObject.CoopStart = 0;
	planeObject.NumberInFormation = 0;
	planeObject.Vulnerable = 1;
	planeObject.Engageable = 1;
	planeObject.LimitAmmo = 1;
	planeObject.StartInAir = 1;
	planeObject.Callsign = 9;
	planeObject.Callnum = 1;
	planeObject.Time = 60;
	planeObject.DamageReport = 50;
	planeObject.DamageThreshold = 1;
	planeObject.PayloadId = 4;
	planeObject.WMMask = 11;
	planeObject.AiRTBDecision = 1;
	planeObject.DeleteAfterDeath = 0;
	planeObject.Fuel = 1;

	planeEntity.setIndex();

	// Link two blocks
	planeObject.LinkTrId = planeEntity.Index;
	planeEntity.MisObjID = planeObject.Index;

	mission.blocks.push(planeObject);
	mission.blocks.push(planeEntity);
};