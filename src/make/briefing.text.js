/** @copyright Simas Toleikis, 2015 */
"use strict";

var mustache = require("mustache");
var getName = require("./flight.pilots").getName;
var getRank = require("./flight.pilots").getRank;

// Plane string constant
var PLANE = "plane";

// Plane type names
var planeTypeNames = {
	fighter: "fighter",
	fighter_heavy: "heavy fighter",
	ground_attack: "ground attack " + PLANE,
	dive_bomber: "dive bomber",
	level_bomber: "bomber",
	transport: "transport" + PLANE
};

/**
 * Make mission briefing text from a templated string.
 *
 * Supported template tags:
 *
 * 	{{airfield}} - Name of the player flight airfield.
 * 	
 * 	{{{plane}}} - Any player plane name representation.
 * 	{{plane.name}} - Player plane model name.
 * 	{{plane.group}} - Player plane group name.
 * 	{{plane.manufacturer}} - Player plane manufacturer name.
 * 	{{{plane.alias}}} - Player plane alias.
 * 	{{plane.type}} - Player plane type.
 * 	
 * 	{{name}} - Any full name.
 * 	{{name.first}} - Any first name.
 * 	{{name.last}} - Any last name.
 *
 * 	Rank TYPE values: commander, pilot
 * 	{{{rank.TYPE}}} - Any TYPE level full rank name.
 * 	{{{rank.TYPE.abbr}}} - Any TYPE level abbreviated rank name.
 *
 * @param {string} template Template string to use for rendering.
 * @param {object} [view] Extra template view data.
 * @returns {string} Rendered briefing text.
 */
module.exports = function makeBriefingText(template, view) {
	
	var rand = this.rand;
	var flight = this.player.flight;
	var context = flight.context;
	
	// Make a context for briefing templates
	if (!context) {
		
		context = flight.context = Object.create(null);
		
		var playerPlane = this.planes[flight.player.plane];
		var names = DATA.countries[flight.country].names;
		var ranks = DATA.countries[flight.country].ranks;
		
		// Flight home airfield name
		context.airfield = this.airfields[flight.airfield].name;
		
		// {{plane}} template tag
		var planeTag = context.plane = Object.create(null);
		
		planeTag.name = playerPlane.name;
		planeTag.group = this.planes[playerPlane.group].name;
		
		if (playerPlane.manufacturer) {
			planeTag.manufacturer = playerPlane.manufacturer;
		}
		
		if (playerPlane.alias) {
			planeTag.alias = "<i>“" + playerPlane.alias + "”</i>";
		}
		
		if (playerPlane.type) {
			
			// Find first matching plane type name
			// NOTE: The order of plane "type" list items is important - the last type is
			// considered to be more important and has a higher value than the first one.
			for (var i = playerPlane.type.length - 1; i >= 0; i--) {
				
				var planeType = playerPlane.type[i];
				
				if (planeType in planeTypeNames) {
					
					planeTag.type = planeTypeNames[planeType];
					break;
				}
			}
		}
		
		// Any player plane name representation
		planeTag.toString = function() {
			
			var sample = [];
			
			if (planeTag.manufacturer) {
				sample.push(planeTag.manufacturer);
			}
			
			if (planeTag.group) {
				sample.push(planeTag.group);
			}
			
			if (planeTag.alias) {
				sample.push(planeTag.alias);
			}
			
			var result = [];
			
			// Select up to two data sample elements (keeping sort order)
			if (sample.length) {
				
				rand
					.sample(
						Object.keys(sample),
						rand.integer(1, Math.min(sample.length, 2))
					)
					.sort()
					.forEach(function(sampleIndex) {
						result.push(sample[sampleIndex]);
					});
			}
			
			// Append plane type
			if (planeTag.type) {
				result.push(planeTag.type);
			}
			// Append a generic "plane" type
			else {
				result.push(PLANE);
			}
			
			return result.join(" ");
		};
		
		// {{name}} template tag
		var nameTag = context.name = Object.create(null);
		
		// Any full name
		nameTag.toString = function() {
			
			var name = getName(names);
			var nameParts = [];
			
			for (var namePart in name) {
				nameParts = nameParts.concat(name[namePart]);
			}
			
			return nameParts.join(" ");
		};
		
		// Any first name
		nameTag.first = function() {

			var first = getName(names).first;
			
			first.toString = function() {
				return this[0];
			};
			
			return first;
		};

		// Any last name
		nameTag.last = function() {
			
			var last = getName(names).last;
			
			last.toString = function() {
				return this.join(" ");
			};
			
			return last;
		};
		
		// {{rank}} template tag
		var rankTag = context.rank = Object.create(null);
		
		// Create tag for each valid rank type
		for (var rankType in ranks.weighted) {
			
			var rankTypeTag = rankTag[rankType] = Object.create(null);
			
			// Full rank name
			rankTypeTag.toString = function() {
				
				var rank = getRank({type: this}, flight.country);
				
				if (rank.name) {
					return "<i>" + rank.name + "</i>";
				}
				
			}.bind(rankType);

			// Abbreviated rank name
			rankTypeTag.abbr = function() {
				
				var rank = getRank({type: this}, flight.country);
				
				if (rank.abbr) {
					return "<i>" + rank.abbr + "</i>";
				}
				
			}.bind(rankType);
		}
	}
	
	// With no custom view data
	if (!view) {
		view = context;
	}
	// With custom view data
	else {
		Object.setPrototypeOf(view, context);
	}
	
	// Render template using Mustache
	var text = mustache.render(template, view);
	
	return text.replace(/\s{2,}/g, " ");
};