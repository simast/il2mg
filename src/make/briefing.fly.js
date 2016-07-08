/** @copyright Simas Toleikis, 2016 */
"use strict";

const numeral = require("numeral");
const data = require("../data");
const makeBriefingText = require("./briefing.text");

// Data constants
const altitudeLevel = data.altitudeLevel;
const briefingColor = data.briefingColor;

// First (intro) plan description segments
const introSegments = [
	"proceed with your mission"
];

// Last (outro) plan description segments
const outroSegments = [
	"keep your eyes open for any enemy contacts"
];

// Make plan fly action briefing
module.exports = function makeBriefingFly(action, flight) {
	
	const rand = this.rand;
	const isPlayerFlightLeader = (flight.player === flight.leader);
	const briefing = [];
	
	let joinIntroOutro = false;
	let briefingIntro = makeBriefingLeadSegment.call(this, flight);
	
	// Pick a random intro segment
	if (briefingIntro.length < 2 && isPlayerFlightLeader) {
		briefingIntro.push(rand.pick(introSegments));
	}
	
	if (!briefingIntro.length === 1) {
		joinIntroOutro = true;
	}
	
	briefingIntro = briefingIntro.join(" and ");
	
	// Add flight route altitude/speed data
	if (!isPlayerFlightLeader) {
		
		const briefingRoute = [];
		const clouds = this.weather.clouds;
		const altitude = action.altitude;
		const speed = action.route[0].speed;
		const altitudeStr = numeral(Math.round(altitude.target / 100) * 100).format("0,0");
		const speedStr = numeral(Math.round(speed / 10) * 10).format("0,0");
		
		let routeType = "designated";
		
		// NOTE: Avoiding multiple "flight" references in the same sentence
		if (briefingIntro.indexOf("flight") === -1) {
			routeType += " flight";
		}
		
		briefingRoute.push("on a " + routeType + " route");
		
		// Include clouds level reference (for significant cover only)
		if (clouds.cover > 20) {
			
			const cloudsMin = clouds.altitude;
			const cloudsMax = clouds.altitude + clouds.thickness;
			let cloudsDelta;
			
			if (altitude.target < cloudsMin) {
				cloudsDelta = altitude.target - cloudsMin;
			}
			else if (altitude.target > cloudsMax) {
				cloudsDelta = altitude.target - cloudsMax;
			}
			
			if (cloudsDelta && Math.abs(cloudsDelta) < 600) {
				
				briefingRoute.push("just");
				
				if (cloudsDelta > 0) {
					briefingRoute.push("above");
				}
				else {
					briefingRoute.push("below");
				}
				
				briefingRoute.push("the clouds");
			}
		}
		
		briefingRoute.push("aiming for");
		
		if (altitude.level === altitudeLevel.LOW) {
			briefingRoute.push("a low");
		}
		else if (altitude.level === altitudeLevel.HIGH) {
			briefingRoute.push("a high");
		}
		
		const lightFontTag = '<font color="' + briefingColor.LIGHT + '">';
		
		briefingRoute.push(lightFontTag + altitudeStr + " meters</font>");
		briefingRoute.push("altitude and");
		briefingRoute.push(lightFontTag + speedStr + " km/h</font> speed");
		
		briefingIntro += " " + briefingRoute.join(" ");
	}
	
	// Pick a random outro segment
	const briefingOutro = rand.pick(outroSegments);
	
	if (joinIntroOutro) {
		briefing.push([briefingIntro, briefingOutro].join(" and "));
	}
	else {
		briefing.push(briefingIntro, briefingOutro);
	}
	
	return briefing.map((value) => {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}).join(". ") + ".";
};

// Make briefing lead text segment for fly routes
function makeBriefingLeadSegment(flight) {
	
	const playerElement = this.player.element;
	const isPlayerInLeadingElement = (playerElement === flight.elements[0]);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	let isPlayerElementLeader = false;
	
	if (playerElement.length > 1 && flight.player === this.player.element[0]) {
		isPlayerElementLeader = true;
	}
	
	let briefingLead = [];
	
	// Make flight lead segment
	if (flight.planes > 1) {

		// Use flight formation name when player is a flight leader
		if (isPlayerFlightLeader) {
			briefingLead.push("lead your {{{formation}}}");
		}
		// Use element sub-formation name when player is an element leader
		else if (isPlayerElementLeader) {
			
			const flightLeaderID = flight.leader.pilot.id;
			
			briefingLead.push("lead your {{{formation.element}}}");
			briefingLead.push("cover your {{{formation}}} leader " + flightLeaderID);
		}
		// Link to AI element leader
		else if (!isPlayerInLeadingElement && playerElement.length > 1) {
			
			const elementLeaderID = playerElement[0].pilot.id;
			
			briefingLead.push("follow your {{{formation.element}}} leader " + elementLeaderID);
			briefingLead.push("cover your {{{formation}}}");
		}
		// Link to AI flight leader
		else {
			
			const flightLeaderID = flight.leader.pilot.id;
			briefingLead.push("follow your {{{formation}}} leader " + flightLeaderID);
		}
		
		briefingLead = briefingLead.map((value) => {
			return makeBriefingText.call(this, value);
		});
	}
	
	return briefingLead;
}

module.exports.makeBriefingLeadSegment = makeBriefingLeadSegment;