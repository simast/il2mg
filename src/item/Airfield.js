/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("./Block");

// Airfield item
function Airfield() {

	// Call parent constructor
	Block.apply(this, arguments);

	this.Callsign = 0;
	this.Callnum = 0;
	this.ReturnPlanes = 0;
	this.Hydrodrome = 0;
	this.RepairFriendlies = 0;
	this.RearmFriendlies = 0;
	this.RefuelFriendlies = 0;
	this.RepairTime = 0;
	this.RearmTime = 0;
	this.RefuelTime = 0;
	this.MaintenanceRadius = 0;
}

Airfield.prototype = Object.create(Block.prototype);
Airfield.prototype.typeID = 9;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
Airfield.prototype.toBinary = function(index) {

	var size = 31;
	var pointItems = [];

	// Find Chart item
	if (this.items && this.items.length) {
		
		var chartItem;
		for (var item of this.items) {

			if (item.type === "Chart") {

				chartItem = item;
				break;
			}
		}
		
		if (chartItem && chartItem.items) {
			
			chartItem.items.forEach(function(item) {
				
				if (item.type === "Point") {
					pointItems.push(item);
				}
			});
		}
	}
	
	size += pointItems.length * 20;

	var buffer = new Buffer(size);
	
	// ReturnPlanes
	this.writeUInt8(buffer, this.ReturnPlanes);
	
	// Hydrodrome
	this.writeUInt8(buffer, this.Hydrodrome);

	// Callsign
	this.writeUInt8(buffer, this.Callsign);
	
	// Callnum
	this.writeUInt8(buffer, this.Callnum);
	
	// RepairFriendlies
	this.writeUInt8(buffer, this.RepairFriendlies);
	
	// RearmFriendlies
	this.writeUInt8(buffer, this.RearmFriendlies);
	
	// RefuelFriendlies
	this.writeUInt8(buffer, this.RefuelFriendlies);
	
	// RepairTime
	this.writeUInt32(buffer, this.RepairTime);

	// RearmTime
	this.writeUInt32(buffer, this.RearmTime);

	// RefuelTime
	this.writeUInt32(buffer, this.RefuelTime);
	
	// MaintenanceRadius
	this.writeUInt32(buffer, this.MaintenanceRadius);
	
	// Unknown data (number of OnReports table items?)
	this.writeUInt32(buffer, 0);
	
	// Number of Chart->Point items
	this.writeUInt32(buffer, pointItems.length);
	
	// List of Point items
	pointItems.forEach(function(item) {
		
		this.writeUInt32(buffer, item.Type); // Type
		this.writeDouble(buffer, item.X); // X
		this.writeDouble(buffer, item.Y); // Y
		
	}, this);
	
	return Block.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = Airfield;