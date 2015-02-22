/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");
var BlockParent = require("../block");

// Options block
function Options() {

}

Options.prototype = Object.create(BlockParent.prototype);
Options.prototype.id = 25;

/**
 * Get binary representation of the block.
 *
 * @param {object} index Binary data index object.
 * @returns {Buffer} Binary representation of the block.
 */
Options.prototype.toBinary = function(index) {

	var date = moment(this.Date, "D.M.YYYY", true);
	var time = moment(this.Time, "H:m:s", true);

	var hmapLength = Buffer.byteLength(this.HMap);
	var texturesLength = Buffer.byteLength(this.Textures);
	var forestsLength = Buffer.byteLength(this.Forests);
	var guiMapLength = Buffer.byteLength(this.GuiMap);
	var layersLength = Buffer.byteLength(this.Layers);
	var seasonPrefixLength = Buffer.byteLength(this.SeasonPrefix);
	var cloudConfigLength = Buffer.byteLength(this.CloudConfig);

	var size = 144;

	size += hmapLength;
	size += texturesLength;
	size += forestsLength;
	size += guiMapLength;
	size += layersLength;
	size += seasonPrefixLength;
	size += cloudConfigLength;

	size += this.WindLayers.length * 8 * 3;
	size += this.Countries.length * 4 * 2;

	var buffer = new Buffer(size);

	// Block ID (or file version?)
	this.writeUInt32(buffer, this.id);

	// MissionType
	this.writeUInt32(buffer, this.MissionType);

	// AqmId
	this.writeUInt32(buffer, this.AqmId);

	// Day
	this.writeUInt32(buffer, date.date());

	// Month
	this.writeUInt32(buffer, date.month() + 1);

	// Year
	this.writeUInt32(buffer, date.year());

	// Seconds
	this.writeUInt32(buffer, time.seconds());

	// Minutes
	this.writeUInt32(buffer, time.minutes());

	// Hours
	this.writeUInt32(buffer, time.hours());

	// HMap
	this.writeString(buffer, hmapLength, this.HMap);

	// Textures
	this.writeString(buffer, texturesLength, this.Textures);

	// Forests
	this.writeString(buffer, forestsLength, this.Forests);

	// Layers
	this.writeString(buffer, layersLength, this.Layers);

	// GuiMap
	this.writeString(buffer, guiMapLength, this.GuiMap);

	// SeasonPrefix
	this.writeString(buffer, seasonPrefixLength, this.SeasonPrefix);

	// LCName
	this.writeUInt32(buffer, this.LCName);

	// LCAuthor
	this.writeUInt32(buffer, this.LCAuthor);

	// LCDesc
	this.writeUInt32(buffer, this.LCDesc);

	// Unknown 8 bytes (always zero)
	// TODO: Investigate, could this be a non-localized indexed Name and Desc properties?
	this.writeUInt32(buffer, 0);
	this.writeUInt32(buffer, 0);

	// CloudLevel
	this.writeUInt32(buffer, this.CloudLevel);

	// CloudHeight
	this.writeUInt32(buffer, this.CloudHeight);

	// PrecLevel
	this.writeUInt32(buffer, this.PrecLevel);

	// PrecType
	this.writeUInt32(buffer, this.PrecType);

	// Turbulence
	this.writeDouble(buffer, this.Turbulence);

	// TempPressLevel
	this.writeDouble(buffer, this.TempPressLevel);

	// Temperature
	this.writeDouble(buffer, this.Temperature);

	// Pressure
	this.writeDouble(buffer, this.Pressure);

	// CloudConfig
	this.writeString(buffer, cloudConfigLength, this.CloudConfig);

	// SeaState
	this.writeUInt32(buffer, this.SeaState);

	// WindLayers length
	this.writeUInt32(buffer, this.WindLayers.length);

	// WindLayers
	this.WindLayers.forEach(function(windLayer) {

		// WindLayer ground height
		this.writeDouble(buffer, windLayer[0]);

		// WindLayer direction
		this.writeDouble(buffer, windLayer[1]);

		// WindLayer speed
		this.writeDouble(buffer, windLayer[2]);

	}, this);

	// Countries length
	this.writeUInt32(buffer, this.Countries.length);

	// Countries
	this.Countries.forEach(function(country) {

		// Country ID
		this.writeUInt32(buffer, country[0]);

		// Coalition ID
		this.writeUInt32(buffer, country[1]);

	}, this);

	return buffer;
};

module.exports = Options;