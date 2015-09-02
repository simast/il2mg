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
 * 	{{{plane}}} - Any (random) player plane name representation.
 * 	{{plane.name}} - Player plane model name.
 * 	{{plane.group}} - Player plane group name.
 * 	{{plane.manufacturer}} - Player plane manufacturer name.
 * 	{{{plane.alias}}} - Player plane alias.
 * 	{{plane.type}} - Player plane type.
 *
 * @param {string} template Template string to use for rendering.
 * @returns {string} Rendered briefing text.
 */
module.exports = function makeBriefingTemplate(template) {
	
	var rand = this.rand;
	var flight = this.player.flight;
	var context = flight.context;
	
	// Make a context for briefing templates
	if (!context) {
		
		context = flight.context = Object.create(null);
		
		// Flight home airfield name
		context.airfield = this.airfields[flight.airfield].name;
		
		// Expose player plane data
		var playerPlane = this.planes[flight.player.plane];
		var plane = context.plane = Object.create(null);
		
		plane.name = playerPlane.name;
		plane.group = this.planes[playerPlane.group].name;
		
		if (playerPlane.manufacturer) {
			plane.manufacturer = playerPlane.manufacturer;
		}
		
		if (playerPlane.alias) {
			plane.alias = "<i>" + playerPlane.alias + "</i>";
		}
		
		if (playerPlane.type) {
			
			// Find first matching plane type name
			// NOTE: The order of plane "type" list items is important - the last type is
			// considered to be more important and has a higher value than the first one.
			for (var i = playerPlane.type.length - 1; i >= 0; i--) {
				
				var planeType = playerPlane.type[i];
				
				if (planeType in planeTypeNames) {
					
					plane.type = planeTypeNames[planeType];
					break;
				}
			}
		}
		
		// Any player plane name representation
		plane.toString = function() {
			
			var sample = [];
			
			if (plane.manufacturer) {
				sample.push(plane.manufacturer);
			}
			
			if (plane.group) {
				sample.push(plane.group);
			}
			
			if (plane.alias) {
				sample.push(plane.alias);
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
			if (plane.type) {
				result.push(plane.type);
			}
			// Append a generic "plane" type
			else {
				result.push(PLANE);
			}
			
			return result.join(" ");
		};
	}
	
	// Render template using Mustache
	var text = mustache.render(template, context);
	
	return text.replace(/\s{2,}/g, " ");
};