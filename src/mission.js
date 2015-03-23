/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var Random = require("random-js");
var data = require("./data");
var Item = require("./item");

// Mission file extensions
var FILE_EXT_TEXT = "Mission";
var FILE_EXT_BINARY = "msnbin";
var FILE_EXT_LIST = "list";

/**
 * Mission constructor.
 *
 * @param {object} params Desired mission parameters (command-line arguments).
 */
function Mission(params) {

	this.items = []; // Items list
	this.lang = []; // Language data
	this.params = params; // Desired mission parameters

	// Initialize random number generator
	this.rand = new Random(Random.engines.browserCrypto);

	// Reserve an empty localization string (used in binary mission generation for
	// items without LCName or LCDesc properties).
	this.getLC("");

	log.I("Making mission...");
	log.profile("Making");

	// Make mission parts
	require("./make/battle")(this, data);
	require("./make/date")(this, data);
	require("./make/time")(this, data);
	require("./make/planes")(this, data);
	require("./make/units")(this, data);
	require("./make/map")(this, data);
	require("./make/vehicles")(this, data);
	require("./make/weather")(this, data);
	require("./make/blocks")(this, data);
	require("./make/airfields")(this, data);
	require("./make/flights")(this, data);
	require("./make/name")(this, data);
	require("./make/briefing")(this, data);

	log.profile("Making");
}

/**
 * Add a new item to the mission.
 *
 * @param {Item} item Item object.
 */
Mission.prototype.addItem = function(item) {

	if (!(item instanceof Item)) {
		throw new TypeError("Invalid mission item value.");
	}

	this.items.push(item);
};

/**
 * Get localized mission language code for a given string.
 *
 * @param {string} text Text string.
 * @returns {number} Localized mission language code.
 */
Mission.prototype.getLC = function(text) {

	if (typeof text !== "string") {
		throw new TypeError("Invalid mission language string.");
	}

	text = text.trim();

	var languageCode = this.lang.indexOf(text);

	if (languageCode < 0) {
		languageCode = this.lang.push(text) - 1;
	}

	return languageCode;
};

/**
 * Save mission files.
 *
 * @param {string} fileName Mission file name.
 * @returns {Promise} Promise object.
 */
Mission.prototype.save = function(fileName) {

	var self = this;

	log.I("Saving mission...");

	// Use specified mission file path and name
	if (fileName && fileName.length) {

		// Make a path without an extension
		var fileDir = path.dirname(fileName);
		var fileBase = path.basename(fileName).replace(/\.[^/.]+$/, "");

		fileName = path.join(fileDir, fileBase);
	}

	// TODO: Generate mission file path and name if not specified

	var promises = [];

	if (this.params.debug) {
		promises.push(this.saveText(fileName));
	}

	promises.push(this.saveBinary(fileName));
	promises.push(this.saveLang(fileName));

	return Promise.all(promises);
};

/**
 * Save text .Mission file.
 *
 * @param {string} fileName Mission file name (without extension).
 * @returns {Promise} Promise object.
 */
Mission.prototype.saveText = function(fileName) {

	var self = this;
	var profileName = "Saving ." + FILE_EXT_TEXT;

	log.profile(profileName);

	var promise = new Promise(function(resolve, reject) {

		var fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_TEXT);

		// Write .Mission data
		fileStream.once("open", function(fd) {

			// Required mission file header
			fileStream.write("# Mission File Version = 1.0;" + os.EOL);

			// Write mission items
			self.items.forEach(function(item) {
				fileStream.write(os.EOL + item.toString() + os.EOL);
			});

			// Required mission file footer
			fileStream.write(os.EOL + "# end of file");

			fileStream.end();
		});

		// Resolve promise
		fileStream.once("finish", resolve);

		// Reject promise
		fileStream.once("error", reject);
	});

	promise.then(function() {
		log.profile(profileName);
	});

	return promise;
};

/**
 * Save binary .msnbin file.
 *
 * @param {string} fileName Mission file name (without extension).
 * @returns {Promise} Promise object.
 */
Mission.prototype.saveBinary = function(fileName) {

	var self = this;
	var profileName = "Saving ." + FILE_EXT_BINARY;

	log.profile(profileName);

	var promise = new Promise(function(resolve, reject) {

		var optionsBuffer;
		var itemBuffers = [];
		var numItems = 0;

		// Create index tables
		var indexTables = {
			name: new BinaryIndexTable(32, 100),
			desc: new BinaryIndexTable(32, 100),
			model: new BinaryIndexTable(64, 100),
			skin: new BinaryIndexTable(128, 100),
			script: new BinaryIndexTable(128, 100),
			damaged: new BinaryIndexTable(32, 0)
		};

		// Collect binary representation of all mission items
		(function walkItems(items) {

			items.forEach(function(item) {

				// Process Group item child items
				if (item instanceof Item.Group) {

					if (item.items && item.items.length) {
						walkItems(item.items);
					}
				}
				// Get item binary representation (data buffers)
				else {

					var buffer = item.toBinary(indexTables);

					// Find Options item buffer
					if (item instanceof Item.Options) {
						optionsBuffer = buffer;
					}
					// Process normal item buffers
					else if (buffer.length) {

						itemBuffers.push(buffer);

						// Process linked item entity
						if (item.entity) {

							itemBuffers.push(item.entity.toBinary(indexTables));
							numItems++;
						}

						numItems++;
					}
				}
			});

		})(self.items);

		if (!optionsBuffer) {
			throw new Error();
		}

		var fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_BINARY);

		fileStream.once("open", function(fd) {

			// Write Options item buffer (has to be the first one in the file)
			fileStream.write(optionsBuffer);

			var indexTableNames = Object.keys(indexTables);
			var itlhBuffer = new Buffer(7); // Index table list header buffer
			var bsBuffer = new Buffer(4); // Item size buffer

			// Write index table list header (number of index tables + 3 unknown bytes)
			itlhBuffer.writeUInt32LE(indexTableNames.length, 0);
			itlhBuffer.fill(0, 4);
			fileStream.write(itlhBuffer);

			// Write index tables
			indexTableNames.forEach(function(tableName) {
				fileStream.write(indexTables[tableName].toBinary());
			});

			// Write items size buffer
			bsBuffer.writeUInt32LE(numItems, 0);
			fileStream.write(bsBuffer);

			// Write item buffers
			itemBuffers.forEach(function(buffer) {

				// Single item buffer
				if (Buffer.isBuffer(buffer)) {
					fileStream.write(buffer);
				}
				// Multiple item buffers
				else if (Array.isArray(buffer)) {

					buffer.forEach(function(buffer) {
						fileStream.write(buffer);
					});
				}
			});

			fileStream.end();
		});

		// Resolve promise
		fileStream.once("finish", resolve);

		// Reject promise
		fileStream.once("error", reject);
	});

	promise.then(function() {
		log.profile(profileName);
	});

	return promise;
};

/**
 * Save .eng and other localisation files.
 *
 * @param {string} fileName Mission file name (without extension).
 * @returns {Promise} Promise object.
 */
Mission.prototype.saveLang = function(fileName) {

	var self = this;
	var promises = [];

	data.languages.forEach(function(lang) {

		var profileName = "Saving ." + lang;

		log.profile(profileName);

		var promise = new Promise(function(resolve, reject) {

			var fileStream = fs.createWriteStream(fileName + "." + lang);

			fileStream.once("open", function(fd) {

				// Write UCS2 little-endian BOM
				fileStream.write("FFFE", "hex");

				// Write language data
				self.lang.forEach(function(value, index) {
					fileStream.write(index + ":" + value + os.EOL, "ucs2");
				});

				fileStream.end();
			});

			// Resolve promise
			fileStream.once("finish", resolve);

			// Reject promise
			fileStream.once("error", reject);
		});

		promise.then(function() {
			log.profile(profileName);
		});

		promises.push(promise);
	});

	return Promise.all(promises);
};

/**
 * Binary data index table constructor (used in saving .msnbin file).
 *
 * @param {number} maxDataLength Index table maximum data item size.
 * @param {number} minItemsCount Index table minimum items count.
 */
function BinaryIndexTable(maxDataLength, minItemsCount) {

	this.header = [];
	this.data = [];
	this.maxDataLength = maxDataLength;
	this.minItemsCount = minItemsCount;
}

/**
 * Manage a string index table.
 *
 * @param {string} value String value to set in the index table.
 * @returns {number} Index table address/index (16 bit unsigned integer).
 */
BinaryIndexTable.prototype.stringValue = function(value) {

	// No index
	if (typeof value !== "string") {
		return 0xFFFF;
	}

	var index = this.data.indexOf(value);

	// Add a new string item
	if (index < 0) {

		this.data.push(value);
		this.header.push(0);

		index = this.data.length - 1;
	}

	// Update string usage (in the header of index table)
	this.header[index]++;

	// No index
	return index;
};

/**
 * Get a binary representation of this index table.
 *
 * @returns {Buffer} Binary representation of the index table.
 */
BinaryIndexTable.prototype.toBinary = function() {

	var dataLength = this.maxDataLength;
	var itemsCount = Math.max(this.minItemsCount, this.data.length);
	var offset = 0;
	var size = 6;

	size += itemsCount * 2;
	size += itemsCount * dataLength;

	var buffer = new Buffer(size);

	// Max size of item
	buffer.writeUInt32LE(dataLength, offset);
	offset += 4;

	// Number of items
	buffer.writeUInt16LE(itemsCount, offset);
	offset += 2;

	// Header items
	for (var h = 0; h < itemsCount; h++) {

		var headerItem = this.header[h] || 0;

		buffer.writeUInt16LE(headerItem, offset);
		offset += 2;
	}

	// Data items
	for (var d = 0; d < itemsCount; d++) {

		var dataItem = this.data[d] || "";

		buffer.fill(0, offset, offset + dataLength);
		buffer.write(dataItem, offset);
		offset += dataLength;
	}

	return buffer;
};

module.exports = Mission;