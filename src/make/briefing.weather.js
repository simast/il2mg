/** @copyright Simas Toleikis, 2015 */
"use strict";

var util = require("util");

var temperatureSegments = [
	"The temperature on the ground is %s.",
	"Current temperature on the spot is %s."
];

// Make weather briefing
module.exports = function makeBriefingWeather() {
	
	var briefing = [];
	var weather = this.weather;
	var rand = this.rand;
	
	// Temperature segment
	var temperature = weather.temperature;
	var temperatureState = weather.temperatureState;
	var tempStr = temperature + "°C";
	var tempStrState;
	
	// 1.25+% change (for the next 15 minutes)
	if (temperatureState >= 1.25) {
		tempStrState = "rising";
	}
	// 1.25-% change (for the next 15 minutes)
	else if (temperatureState <= -1.25) {
		tempStrState = "falling";
	}
	
	if (tempStrState) {
		tempStr += " and " + tempStrState;
	}
	
	briefing.push(util.format(rand.pick(temperatureSegments), tempStr));
	
	return briefing.join(" ");
};