/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("./Block");

// Airfield item
function Airfield() {

	// Call parent constructor
	Block.apply(this, arguments);

	this.Callsign = 0;
	this.Callnum = 0;
	this.ReturnPlanes = 1;
	this.Hydrodrome = 0;
	this.RepairFriendlies = 0;
	this.RearmFriendlies = 0;
	this.RefuelFriendlies = 0;
	this.RepairTime = 0;
	this.RearmTime = 0;
	this.RefuelTime = 0;
	this.MaintenanceRadius = 0;
	this.Model = "graphics\\airfields\\fakefield.mgm";
	this.Script = "luascripts\\worldobjects\\airfields\\fakefield.txt";
}

Airfield.prototype = Object.create(Block.prototype);
Airfield.prototype.typeID = 9;

module.exports = Airfield;