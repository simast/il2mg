/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var os = require("os");
var util = require("util");
var path = require("path");
var Random = require("random-js");
var Item = require("./item");

// Mission file extensions
var FILE_EXT_TEXT = "Mission";
var FILE_EXT_BINARY = "msnbin";
var FILE_EXT_LIST = "list";

// Mission file formats
Mission.FORMAT_TEXT = "text";
Mission.FORMAT_BINARY = "binary";

// List of mission parameters that make up the complex seed value
// NOTE: The order is important and is used to define parameter sequence
var COMPLEX_SEED_PARAMS = [
	"seed", // Base seed value (numeric)
	"battle",
	"date",
	"time",
	"coalition",
	"country",
	"pilot",
	"state",
	"airfield"
];

/**
 * Mission constructor.
 *
 * @param {object} params Desired mission parameters.
 */
function Mission(params) {

	this.items = []; // Items list
	this.lang = []; // Language data
	this.params = params; // Desired mission parameters

	// Debug mode flag
	this.debug = (this.params.debug === true);

	// Last item index value
	this.lastIndex = 0;

	// Reserve an empty localization string (used in binary mission generation for
	// items without LCName or LCDesc properties).
	this.getLC("");
	
	// Initialize random number generator
	this.initRand(params);

	log.I("Making mission...");
	log.profile("Making");

	// Make mission parts
	require("./make/battle").call(this);
	require("./make/date").call(this);
	require("./make/time").call(this);
	require("./make/map").call(this);
	require("./make/planes").call(this);
	require("./make/units").call(this);
	require("./make/vehicles").call(this);
	require("./make/weather").call(this);
	require("./make/airfields").call(this);
	require("./make/player").call(this);
	require("./make/fronts").call(this);
	require("./make/blocks").call(this);
	require("./make/flights").call(this);
	require("./make/name").call(this);
	require("./make/briefing").call(this);

	log.profile("Making");
}

/**
 * Initialize random number generator.
 *
 * @param {object} params Desired mission parameters.
 */
Mission.prototype.initRand = function(params) {

	var complexSeed;

	// Initialize from existing seed
	if (params.seed) {

		// Make sure the seed parameter is exclusive and is not used together with
		// other complex seed parameters.
		for (var i = 1; i < COMPLEX_SEED_PARAMS.length; i++) {

			var param = COMPLEX_SEED_PARAMS[i];

			if (param in params) {
				throw ['Cannot use "%s" parameter together with seed.', param];
			}
		}

		// Try a complex seed value (with Base64 parameters)
		try {
			complexSeed = JSON.parse(new Buffer(params.seed, "base64").toString("utf8"));
		}
		catch (e) {}

		if (typeof complexSeed === "object") {

			// Restore parameters from complex seed value
			COMPLEX_SEED_PARAMS.forEach(function(param, paramIndex) {

				if (paramIndex in complexSeed) {
					params[param] = complexSeed[paramIndex];
				}
			});
		}

		// Handle simple seed value (numeric)
		if (/^[0-9]+$/.test(params.seed)) {

			var seedNumber = parseInt(params.seed, 10);

			if (!isNaN(seedNumber) && seedNumber > 0) {
				this.seed = seedNumber;
			}
		}

		// Validate seed value
		if (!this.seed) {
			throw ["Invalid mission seed!", {seed: params.seed}];
		}
	}
	// Create a new seed
	else {

		this.seed = Date.now();

		// Check seed affecting parameters and create a complex seed if necessary
		COMPLEX_SEED_PARAMS.forEach(function(param, paramIndex) {

			if (param in params) {

				complexSeed = complexSeed || Object.create(null);
				complexSeed[paramIndex] = params[param];
			}
		});
		
		if (complexSeed) {
			complexSeed[0] = this.seed;
		}
	}
	
	// Initialize random number generator
	var mtRand = Random.engines.mt19937();
	mtRand.seed(this.seed);
	this.rand = new Random(mtRand);
	
	// Save seed value as a localization string
	if (complexSeed) {
		this.getLC(new Buffer(JSON.stringify(complexSeed), "utf8").toString("base64"));
	}
	else {
		this.getLC(this.seed.toString());
	}
};

/**
 * Create a new mission item.
 *
 * @param {string} itemType Item type name.
 * @param {mixed} [parent] Add to the mission (true) or parent item (object).
 */
Mission.prototype.createItem = function(itemType, parent) {

	if (!Item[itemType]) {
		throw new TypeError("Invalid item type value.");
	}

	// Add item to mission if parent is not specified
	if (parent !== false && !(parent instanceof Item)) {
		parent = this;
	}

	var item = new Item[itemType]();

	if (item.hasIndex) {

		// Set unique item index
		Object.defineProperty(item, "Index", {
			enumerable: true,
			value: ++this.lastIndex
		});
	}

	// Set item mission reference
	Object.defineProperty(item, "mission", {
		value: this
	});

	// Add item to parent item object
	if (parent) {
		parent.addItem(item);
	}

	return item;
};

/**
 * Add a new item to the mission.
 *
 * @param {Item} item Item object.
 */
Mission.prototype.addItem = function(item) {

	if (!(item instanceof Item)) {
		throw new TypeError("Invalid item value.");
	}

	// Add child item
	this.items.push(item);

	// Set child item parent reference
	Object.defineProperty(item, "parent", {
		value: this,
		configurable: true
	});
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
 * Get unique callsign.
 *
 * @param {string} type Callsign type.
 * @returns {object} Unique callsign.
 */
Mission.prototype.getCallsign = function(type) {

	if (!DATA.callsigns[type]) {
		throw new TypeError("Invalid callsign type value.");
	}

	// Track last used callsign index
	if (!this.lastCallsign) {
		this.lastCallsign = Object.create(null);
	}

	// Initialize/shuffle callsign list data
	if (this.lastCallsign[type] === undefined) {

		this.rand.shuffle(DATA.callsigns[type]);
		this.lastCallsign[type] = 0;
	}
	// Use next available callsign
	else {

		this.lastCallsign[type]++;

		// Cycle callsign list
		if (this.lastCallsign[type] >= DATA.callsigns[type].length) {
			this.lastCallsign[type] = 0;
		}
	}

	return DATA.callsigns[type][this.lastCallsign[type]];
};

/**
 * Save mission files.
 *
 * @param {string} fileName Mission file name.
 * @returns {Promise} Promise object.
 */
Mission.prototype.save = function(fileName) {

	var self = this;
	var format = this.params.format || Mission.FORMAT_BINARY;
	var promises = [];

	log.I("Saving mission...");

	// Use specified mission file path and name
	if (fileName && fileName.length) {

		// Make a path without an extension
		var fileDir = path.dirname(fileName);
		var fileBase = path.basename(fileName).replace(/\.[^/.]+$/, "");

		fileName = path.join(fileDir, fileBase);
	}
	// Generate mission file path and name if not specified
	else {
		fileName = DATA.name + "-" + this.seed;
	}

	// Save text format file
	if (format === Mission.FORMAT_TEXT || (this.debug && !this.params.format)) {
		promises.push(this.saveText(fileName));
	}

	// Save binary format file
	if (format === Mission.FORMAT_BINARY || (this.debug && !this.params.format)) {
		promises.push(this.saveBinary(fileName));
	}

	// Save language files
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
			name: new BinaryStringTable(32, 100),
			desc: new BinaryStringTable(32, 100),
			model: new BinaryStringTable(64, 100),
			skin: new BinaryStringTable(128, 100),
			script: new BinaryStringTable(128, 100),
			damage: new BinaryDamageTable()
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

	DATA.languages.forEach(function(lang) {

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
 * Binary string data index table constructor (used in saving .msnbin file).
 *
 * @param {number} maxDataLength Index table maximum data item size.
 * @param {number} minItemsCount Index table minimum items count.
 */
function BinaryStringTable(maxDataLength, minItemsCount) {

	this.header = [];
	this.data = [];
	this.maxDataLength = maxDataLength;
	this.minItemsCount = minItemsCount;
}

/**
 * Get string data index table value.
 *
 * @param {string} value String value to set in the index table.
 * @returns {number} Index table address/index (16 bit unsigned integer).
 */
BinaryStringTable.prototype.value = function(value) {

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

	return index;
};

/**
 * Get a binary representation of string data index table.
 *
 * @returns {Buffer} Binary representation of string data index table.
 */
BinaryStringTable.prototype.toBinary = function() {

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

/**
 * Binary damage data index table constructor (used in saving .msnbin file).
 */
function BinaryDamageTable() {

	this.data = [];
	this.dataIndex = Object.create(null);
	this.maxDamageValues = 0;
}

/**
 * Get damage data index table value.
 *
 * @param {string} value "Damaged" item to set in the index table.
 * @returns {number} Index table address/index (16 bit unsigned integer).
 */
BinaryDamageTable.prototype.value = function(value) {

	// Invalid value
	if (!(value instanceof Item) || value.type !== "Damaged") {
		throw new TypeError("Invalid damage item value.");
	}

	// TODO: Sort damage index values before JSON stringify
	var valueID = JSON.stringify(value);
	var index = this.dataIndex[valueID];

	// Register a new unique damage value
	if (index === undefined) {

		var damageKeys = Object.keys(value);

		this.maxDamageValues = Math.max(this.maxDamageValues, damageKeys.length);
		this.data.push(value);

		index = this.dataIndex[valueID] = this.data.length - 1;
	}

	return index;
};

/**
 * Get a binary representation of damage data index table.
 *
 * @returns {Buffer} Binary representation of string data index table.
 */
BinaryDamageTable.prototype.toBinary = function() {

	var itemsCount = this.data.length;
	var offset = 0;
	var size = 6;

	if (itemsCount > 0) {

		size += 4;
		size += itemsCount * (1 + this.maxDamageValues * 2);
	}

	var buffer = new Buffer(size);

	// Max number of damage values
	buffer.writeUInt32LE(this.maxDamageValues, offset);
	offset += 4;

	// Number of items
	buffer.writeUInt16LE(itemsCount, offset);
	offset += 2;

	if (itemsCount > 0) {

		// Number of free/unused table items
		buffer.writeUInt32LE(0, offset);
		offset += 4;

		// Write damage data items
		this.data.forEach(function(damageItem) {

			var damageKeys = Object.keys(damageItem);

			// Number of damage key items
			buffer.writeUInt8(damageKeys.length, offset);
			offset += 1;

			// Write damage keys/values
			for (var k = 0; k < this.maxDamageValues; k++) {

				var damageKey = 0xFF;
				var damageValue = 0;

				// Use assigned damage key/value pair
				if (damageKeys.length) {

					damageKey = damageKeys.shift();
					damageValue = damageItem[damageKey];
				}

				if (damageValue >= 0 && damageValue <= 1) {

					// NOTE: Damage value in binary file is represented as a 8 bit unsigned
					// integer number with a range from 0 to 255.
					damageValue = Math.round(255 * damageValue);
				}
				else {
					damageValue = 0;
				}

				buffer.writeUInt8(damageKey, offset);
				offset += 1;

				buffer.writeUInt8(damageValue, offset);
				offset += 1;
			}
		}, this);
	}

	return buffer;
};

module.exports = Mission;