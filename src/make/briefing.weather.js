/** @copyright Simas Toleikis, 2015 */
"use strict";

var makeBriefingText = require("./briefing.text");
var weatherState = DATA.weatherState;

// General weather description segments
var generalSegments = [
	"{{weather.state}} weather conditions on the airfield {{weather.time}} with {{weather.sky}} and {{weather.wind}}",
	"{{name.first}}, our weather officer, has reported {{weather.state}} flying conditions {{weather.time}} with {{weather.wind}} and {{weather.sky}}",
	"Latest weather reports indicate {{weather.state}} flying conditions {{weather.time}} with {{weather.sky}} and {{weather.wind}}"
];

// Temperature description segments
var temperatureSegments = [
	"The temperature on the ground is {{weather.temperature}}",
	"Current temperature on the spot is {{weather.temperature}}"
];

// Weather state descriptions
var stateSegments = {};

stateSegments[weatherState.PERFECT] = ["perfect", "excellent", "great", "pleasant"];
stateSegments[weatherState.GOOD] = ["good", "fair", "fine", "decent"];
stateSegments[weatherState.BAD] = ["bad", "poor", "rough", "lousy"];
stateSegments[weatherState.EXTREME] = ["harsh", "severe", "awful", "terrible"];

// TODO: Cloud and sky description segments
var skySegments = [
	"clear skies",
	"clear blue skies",
	"cloudless skies",
	"crystal clear skies",
	"small patches of clouds",
	"dense cloud cover",
	"shallow cloud sheet base",
	"full overcast",
	"low sunlit clouds"
];

// TODO: Wind description segments
var windSegments = [
	"no noticeable wind",
	"calm 2 m/s winds blowing from the east",
	"3 m/s winds blowing from south-west",
	"strong 8 m/s winds blowing from north-east",
	"cold 5 m/s northerly winds"
];

// Make weather briefing
module.exports = function makeBriefingWeather() {
	
	var briefing = [];
	var weather = this.weather;
	var rand = this.rand;
	var context = {};
	
	// Weather state description
	context.state = rand.pick(stateSegments[weather.state]);
	
	// 25% chance to add season as part of weather state, e.g. "perfect summer"
	if (rand.bool(0.25)) {
		context.state += " " + this.map.season;
	}
	
	// Set specific weather time context (if any)
	for (var time of ["morning", "afternoon", "evening", "night"]) {
		
		if (this.time[time]) {
			
			context.time = "this " + time;
			break;
		}
	}
	
	// Use default generic time context (25% chance to always prefer generic one)
	if (!context.time || rand.bool(0.25)) {
		
		var timeNow = ["right now", "at the moment", "just now"];
		
		if (this.time.night) {
			timeNow.push("tonight");
		}
		else {
			timeNow.push("today");
		}
		
		context.time = rand.pick(timeNow);
	}
	
	// TODO
	context.sky = rand.pick(skySegments);
	context.wind = rand.pick(windSegments);
	
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
	
	context.temperature = tempStr;
	
	var view = {weather: context};
	
	// Render weather segments
	briefing.push(makeBriefingText.call(this, rand.pick(generalSegments), view));
	briefing.push(makeBriefingText.call(this, rand.pick(temperatureSegments), view));
	
	briefing = briefing.join(". ") + ".";
	briefing = briefing.charAt(0).toUpperCase() + briefing.slice(1);
	
	return briefing;
};