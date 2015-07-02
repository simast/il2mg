/** @copyright Simas Toleikis, 2015 */
"use strict";

var MCU = require("./MCU");

// Icon item
function MCU_Icon() {

	// Call parent constructor
	MCU.apply(this, arguments);

	this.Enabled = 1;
	this.LCName = 0;
	this.LCDesc = 0;
	this.IconId = MCU_Icon.ICON_NONE;
	this.RColor = 0;
	this.GColor = 0;
	this.BColor = 0;
	this.LineType = MCU_Icon.LINE_NORMAL;
}

MCU_Icon.prototype = Object.create(MCU.prototype);
MCU_Icon.prototype.typeID = 35;

// Icon type constants
MCU_Icon.ICON_NONE = 0;
MCU_Icon.ICON_ENEMY_RECON = 101;
MCU_Icon.ICON_ENEMY_BOMBER = 102;
MCU_Icon.ICON_ENEMY_FIGHTER = 103;
MCU_Icon.ICON_ENEMY_DOGFIGHT = 104;
MCU_Icon.ICON_ENEMY_DUEL = 105;
MCU_Icon.ICON_FRIEND_RECON = 151;
MCU_Icon.ICON_FRIEND_BOMBER = 152;
MCU_Icon.ICON_PATROL = 201;
MCU_Icon.ICON_RECON = 202;
MCU_Icon.ICON_ENEMY_TRANSPORT = 501;
MCU_Icon.ICON_ENEMY_ARMOR = 502;
MCU_Icon.ICON_ENEMY_TANK = 503;
MCU_Icon.ICON_ENEMY_AAA = 504;
MCU_Icon.ICON_ENEMY_ARTILLERY = 505;
MCU_Icon.ICON_ENEMY_BALLOON = 506;
MCU_Icon.ICON_ENEMY_BUILDING = 507;
MCU_Icon.ICON_ENEMY_TRAIN = 508;
MCU_Icon.ICON_ENEMY_SHIP = 509;
MCU_Icon.ICON_ENEMY_BRIDGE = 510;
MCU_Icon.ICON_ENEMY_LINE = 511;
MCU_Icon.ICON_FRIEND_TRANSPORT = 551;
MCU_Icon.ICON_FRIEND_ARMOR = 552;
MCU_Icon.ICON_FRIEND_TANK = 553;
MCU_Icon.ICON_FRIEND_AAA = 554;
MCU_Icon.ICON_FRIEND_ARTILLERY = 555;
MCU_Icon.ICON_FRIEND_BALLOON = 556;
MCU_Icon.ICON_FRIEND_BUILDING = 557;
MCU_Icon.ICON_FRIEND_TRAIN = 558;
MCU_Icon.ICON_FRIEND_SHIP = 559;
MCU_Icon.ICON_FRIEND_BRIDGE = 560;
MCU_Icon.ICON_FRIEND_LINE = 561;
MCU_Icon.ICON_WAYPOINT = 901;
MCU_Icon.ICON_ACTION_POINT = 902;
MCU_Icon.ICON_TAKE_OFF = 903;
MCU_Icon.ICON_LAND = 904;
MCU_Icon.ICON_AIRFIELD = 905;

// TODO: Line type constants
MCU_Icon.LINE_NORMAL = 0;

/**
 * Get binary representation of the item.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the item.
 */
MCU_Icon.prototype.toBinary = function(index) {

	var size = 32;

	if (Array.isArray(this.Coalitions)) {
		size += this.Coalitions.length * 4;
	}

	var buffer = new Buffer(size);

	// IconId
	this.writeUInt32(buffer, this.IconId);

	// RColor
	this.writeUInt32(buffer, this.RColor);

	// GColor
	this.writeUInt32(buffer, this.GColor);

	// BColor
	this.writeUInt32(buffer, this.BColor);

	// LineType
	this.writeUInt32(buffer, this.LineType);

	// LCName
	this.writeUInt32(buffer, this.LCName);

	// LCDesc
	this.writeUInt32(buffer, this.LCDesc);

	// Coalitions
	this.writeUInt32Array(buffer, this.Coalitions || []);

	return MCU.prototype.toBinary.apply(this, arguments).concat(buffer);
};

module.exports = MCU_Icon;