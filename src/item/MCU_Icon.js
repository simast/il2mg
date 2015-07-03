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
MCU_Icon.ICON_ENEMY_TANKS = 503;
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
MCU_Icon.ICON_FRIEND_TANKS = 553;
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

// Line type constants
MCU_Icon.LINE_NORMAL = 0;
MCU_Icon.LINE_BOLD = 1;
MCU_Icon.LINE_BORDER = 2;
MCU_Icon.LINE_ZONE_1 = 3;
MCU_Icon.LINE_ZONE_2 = 4;
MCU_Icon.LINE_ZONE_3 = 5;
MCU_Icon.LINE_ZONE_4 = 6;
MCU_Icon.LINE_SECTOR_1 = 7;
MCU_Icon.LINE_SECTOR_2 = 8;
MCU_Icon.LINE_SECTOR_3 = 9;
MCU_Icon.LINE_SECTOR_4 = 10;
MCU_Icon.LINE_ATTACK = 11;
MCU_Icon.LINE_DEFEND = 12;
MCU_Icon.LINE_POSITION_0 = 13;
MCU_Icon.LINE_POSITION_1 = 14;
MCU_Icon.LINE_POSITION_2 = 15;
MCU_Icon.LINE_POSITION_3 = 16;
MCU_Icon.LINE_POSITION_4 = 17;
MCU_Icon.LINE_POSITION_5 = 18;
MCU_Icon.LINE_POSITION_6 = 19;
MCU_Icon.LINE_POSITION_7 = 20;
MCU_Icon.LINE_POSITION_8 = 21;
MCU_Icon.LINE_POSITION_9 = 22;

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