/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../Mission").DATA;
var Entity = require("../Entity");

/**
 * Create Plane/MCU_TR_Entity entities.
 *
 * @param {string} type Airplane type.
 */
function Airplane(type) {

	var dataPlane = DATA.airplanes[type];

	this.set("Script", dataPlane.script);
	this.set("Model", dataPlane.model);
	this.set("Country", 201);
	this.set("Skin", "bf109g2/bf109g2_winter.dds");
	this.set("AILevel", 0);
	this.set("CoopStart", 0);
	this.set("NumberInFormation", 0);
	this.set("Vulnerable", 1);
	this.set("Engageable", 1);
	this.set("LimitAmmo", 1);
	this.set("StartInAir", 2);
	this.set("Callsign", 18);
	this.set("Callnum", 1);
	this.set("Time", 60);
	this.set("DamageReport", 50);
	this.set("DamageThreshold", 1);
	this.set("PayloadId", 0);
	this.set("WMMask", 1);
	this.set("AiRTBDecision", 0);
	this.set("DeleteAfterDeath", 0);
	this.set("Fuel", 1);
}

Airplane.prototype = new Entity("Plane");

module.exports = Airplane;