/** @copyright Simas Toleikis, 2015 */
"use strict";

const makeBriefingText = require("./briefing.text");
const weatherState = DATA.weatherState;

// General weather description segments
const generalSegments = [
	"{{weather.state}} weather conditions on the airfield {{weather.time}} with {{weather.reason.0}} and {{weather.reason.1}}",
	"{{name.first}}, our weather officer, has reported {{weather.state}} flying conditions {{weather.time}} with {{weather.reason.0}} and {{weather.reason.1}}",
	"Latest weather reports indicate {{weather.state}} flying conditions {{weather.time}} with {{weather.reason.0}} and {{weather.reason.1}}"
];

// Temperature description segments
const temperatureSegments = [
	"The temperature on the ground is {{weather.temp}}",
	"Current temperature on the spot is {{weather.temp}}",
	"Present temperature on site is {{weather.temp}}",
	"Thermometer is measuring a temperature of {{weather.temp.value}}"
];

// Weather state descriptions
const stateSegments = {
	[weatherState.PERFECT]: ["perfect", "excellent", "great", "pleasant", "nice"],
	[weatherState.GOOD]: ["good", "fair", "fine", "decent", "favourable"],
	[weatherState.BAD]: ["bad", "poor", "rough", "lousy", "adverse"],
	[weatherState.EXTREME]: ["extreme", "dreadful", "awful", "terrible", "severe"]
};

// Cloud cover types
const cloudCover = {
	CLEAR: 1,
	FEW: 2,
	SCATTERED: 3,
	BROKEN: 4,
	OVERCAST: 5
};

// Sky and cloud cover description segments
const skySegments = {
	[cloudCover.CLEAR]: [
		"clear skies",
		"cloudless skies",
		"crystal clear skies"
	],
	[cloudCover.FEW]: [
		"small patches of clouds in the sky",
		"few clouds hanging in the sky",
		"mostly cloudless skies",
		"some clouds in the sky"
	],
	[cloudCover.SCATTERED]: [
		"partly clouded skies",
		"scattered cloud cover",
		"some low clouds in the sky"
	],
	[cloudCover.BROKEN]: [
		"dense cloud cover",
		"gray cloudy skies",
		"thick cloud cover",
		"sky full of clouds"
	],
	[cloudCover.OVERCAST]: [
		"full overcast"
	]
};

// Wind direction names
const windDirection = {
	
	// 4 point directions
	"4": [
		"northerly",
		"easterly",
		"southerly",
		"westerly"
	],
	
	// 8 point directions
	"8": [
		"north",
		"northeast",
		"east",
		"southeast",
		"south",
		"southwest",
		"west",
		"northwest"
	],
	
	// 16 point directions
	"16": [
		"north",
		"north-northeast",
		"northeast",
		"east-northeast",
		"east",
		"east-southeast",
		"southeast",
		"south-southeast",
		"south",
		"south-southwest",
		"southwest",
		"west-southwest",
		"west",
		"west-northwest",
		"northwest",
		"north-northwest"
	]
};

// TODO: Precipitation segments
const precipitationSegments = [
	"it is raining very hard",
	"it is raining a little"
];

// Make weather briefing
module.exports = function makeBriefingWeather() {
	
	const rand = this.rand;
	const weather = this.weather;
	const context = {};
	let briefing = [];
	
	// Weather state description
	context.state = rand.pick(stateSegments[weather.state]);
	
	// 25% chance to add season as part of weather state, e.g. "perfect summer"
	if (rand.bool(0.25)) {
		context.state += " " + this.map.season;
	}
	
	// Set specific weather time context (if any)
	for (let time of ["morning", "afternoon", "evening", "night"]) {
		
		if (this.time[time]) {
			
			context.time = "this " + time;
			break;
		}
	}
	
	// Use default generic time context (25% chance to always prefer generic one)
	if (!context.time || rand.bool(0.25)) {
		
		const timeNow = ["right now", "at the moment", "just now"];
		
		if (this.time.night) {
			timeNow.push("tonight");
		}
		else {
			timeNow.push("today");
		}
		
		context.time = rand.pick(timeNow);
	}
	
	// Weather state/condition reasons
	const weatherReasons = {};
	
	// Sky and cloud cover segment
	const cover = weather.clouds.cover;
	let coverType = cloudCover.CLEAR;
	
	// Map matching cloud cover type
	if (cover >= 100) {
		coverType = cloudCover.OVERCAST;
	}
	else if (cover >= 70) {
		coverType = cloudCover.BROKEN;
	}
	else if (cover >= 32) {
		coverType = cloudCover.SCATTERED;
	}
	else if (cover > 0) {
		coverType = cloudCover.FEW;
	}
	
	weatherReasons.clouds = rand.pick(skySegments[coverType]);
	
	// Wind segment
	const wind = weather.wind[0]; // At ground level
	const windSpeed = Math.round(wind.speed);
	let windSegment = "no noticeable wind";
	
	if (windSpeed > 0) {
		
		windSegment = "";
		
		// Number of direction points to use in the report
		let windPrecision = 8;
		
		// Calm wind speed type
		if (windSpeed <= 2) {
			
			windSegment = rand.pick(["calm", "mild"]);
			windPrecision = 4;
		}
		// Strong wind speed type
		else if (windSpeed >= 6) {
			
			// Extremely strong winds for flight
			if (windSpeed >= 10) {
				windSegment = rand.pick(["fierce", "violent"]);
			}
			// Strong winds
			else {
				windSegment = rand.pick(["strong", "powerful"]);
			}
			
			windPrecision = 16;
		}
		
		let windDir = wind.direction;
		
		// NOTE: Wind direction represents where the wind is blowing to and not where
		// it is coming from. We have to invert this direction for the briefing text.
		windDir = (windDir + 180) % 360;
		
		const windBearingSize = 360 / windPrecision;
		const windBearing = Math.floor((windBearingSize / 2 + windDir) / windBearingSize % windPrecision);
		
		windSegment += " " + windSpeed + " m/s";
		
		// Just 4 directions for calm winds
		if (windPrecision === 4) {
			windSegment += " " + windDirection[windPrecision][windBearing];
		}
		
		windSegment += " winds";
		
		// Use more direction precision points for stronger winds
		if (windPrecision > 4) {
			windSegment += " blowing from the " + windDirection[windPrecision][windBearing];
		}
	}
	
	weatherReasons.winds = windSegment;
	
	context.reason = [];
	
	// Order weather reason context based on state priority
	rand.shuffle(Object.keys(weatherReasons)).sort(function(a, b) {
		
		// Use worst reason first
		if (weather.state > weatherState.GOOD) {
			return weather.points[a] < weather.points[b];
		}
		// Use best reason first
		else {
			return weather.points[a] > weather.points[b];
		}
	}).forEach(function(reasonType) {
		context.reason.push(weatherReasons[reasonType]);
	});
	
	// Temperature segment
	const temperature = weather.temperature;
	const temperatureState = weather.temperatureState;
	
	context.temp = {
		
		// TODO: Use Fahrenheit or Celcius based on player unit country
		value: temperature + "°C",
		
		// {{weather.temp}} value output
		toString: function() {
			
			let output = this.value;
			
			if (this.state) {
				output += " " + this.state;
			}
			
			return output;
		}
	};
	
	// 1.25+% change (for the next 15 minutes)
	if (temperatureState >= 1.25) {
		context.temp.state = "and rising";
	}
	// 1.25-% change (for the next 15 minutes)
	else if (temperatureState <= -1.25) {
		context.temp.state = "and falling";
	}
	
	const view = {weather: context};
	
	// Render weather segments
	briefing.push(makeBriefingText.call(this, rand.pick(generalSegments), view));
	briefing.push(makeBriefingText.call(this, rand.pick(temperatureSegments), view));
	
	briefing = briefing.join(". ") + ".";
	briefing = briefing.charAt(0).toUpperCase() + briefing.slice(1);
	
	return briefing;
};