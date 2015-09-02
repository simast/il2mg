/** @copyright Simas Toleikis, 2015 */
"use strict";

var mustache = require("mustache");

// Plane type names
var planeTypeNames = {
	fighter: "fighter",
	fighter_heavy: "heavy fighter",
	ground_attack: "ground attack",
	dive_bomber: "dive bomber",
	level_bomber: "bomber",
	transport: "transport"
};

// Make mission briefing text from a templated string
module.exports = function makeBriefingTemplate(template) {
	
	var rand = this.rand;
	var flight = this.player.flight;
	var context = flight.context;
	
	// Make a context for briefing templates
	if (!context) {
		
		context = Object.create(null);
		
		// Flight home airfield name
		context.airfield = this.airfieldsByID[flight.airfield].name;
		
		var playerPlane = this.planesByID[flight.player.plane];
		
		// Player plane data
		var plane = context.plane = Object.create(null);
		
		plane.name = playerPlane.name;
		plane.group = this.planesByID[playerPlane.group].name;
		
		if (playerPlane.manufacturer) {
			plane.manufacturer = playerPlane.manufacturer;
		}
		
		if (playerPlane.alias) {
			plane.alias = "<i>“" + rand.pick(playerPlane.alias) + "”</i>";
		}
		
		if (playerPlane.type) {
			
			// Find first matching plane type name
			for (var i = playerPlane.type.length - 1; i >= 0; i--) {
				
				var planeType = playerPlane.type[i];
				
				if (planeType in planeTypeNames) {
					
					plane.type = planeTypeNames[planeType];
					break;
				}
			}
		}
		
		// Any player plane name representation - as {{plane}} variable
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

			if (plane.type) {
				sample.push(plane.type);
			}
			
			if (!sample.length) {
				return "";
			}
			
			var result = [];
			
			// Select up to two data sample elements (keeping sort order)
			var sampleIndexes = rand.sample(
				Object.keys(sample),
				Math.min(sample.length, 2)
			).sort();
			
			for (var sampleIndex of sampleIndexes) {
				result.push(sample[sampleIndex]);
			}
			
			return result.join(" ");
		};
		
		flight.context = context;
	}
	
	// Render template using Mustache
	var text = mustache.render(template, context);
	
	return text.replace(/\s{2,}/g, " ");
};