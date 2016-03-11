/** @copyright Simas Toleikis, 2015 */
"use strict";

const numeral = require("numeral");
const Vector = require("sylvester").Vector;
const data = require("../data");
const Item = require("../item");
const makeBriefingText = require("./briefing.text");

// Data constants
const planAction = data.planAction;
const mapColor = data.mapColor;

// First (intro) plan description segments
const introSegments = [
	"stay within visual range of the airfield",
	"carry out an effective cover for the airfield",
	"fly over and around the airfield",
	"support local anti-aircraft ground defense units"
];

// Last (outro) plan description segments
const outroSegments = [
	"ground staff will be in close contact and will provide full radio support",
	"proceed with your mission until out of fuel or ammunition",
	"keep your eyes open for any enemy contacts",
	"maintain a strict and tight formation"
];

// Make mission cover airfield task
module.exports = function makeTaskCover(flight) {

	// Add custom cover airfield plan action
	flight.plan.push({
		makeAction: makeTaskCoverAction,
		makeBriefing: makeTaskCoverBriefing
	});
};

// Make mission cover airfield plan action
function makeTaskCoverAction(action, element, flight, input) {
	
	if (!input) {
		return;
	}

	const leaderElement = flight.elements[0];

	// Proccess cover action only for leading element
	if (element !== leaderElement) {
		return;
	}

	const rand = this.rand;
	const airfield = this.airfields[flight.airfield];
	const leaderPlaneItem = element[0].item;
	const beacon = airfield.beacon;

	let climbAltitude = 0;
	let coverCommand;

	// Only climb above airfield with low cloud cover
	if (this.weather.clouds.cover < 50) {
		action.climbAltitude = climbAltitude = rand.integer(1200, 2200);
	}

	// Use climb waypoint above the airfield as a cover command
	if (climbAltitude) {

		coverCommand = flight.group.createItem("MCU_Waypoint");

		coverCommand.Area = rand.integer(75, 125);
		coverCommand.Speed = 280;
		coverCommand.Priority = Item.MCU_Waypoint.PRIORITY_LOW;

		// Set waypoint position above the airfield
		coverCommand.setPosition(
			airfield.position[0] + rand.pick([-1, 1]) * rand.integer(200, 600),
			airfield.position[1] + climbAltitude,
			airfield.position[2] + rand.pick([-1, 1]) * rand.integer(200, 600)
		);

		coverCommand.addObject(leaderPlaneItem);

		// NOTE: The waypoint command is a cylinder and not a sphere. To make flights
		// actually reach required waypoint altitude and not to abort on first pass
		// below the waypoint - we use a trick with a timer that keeps activating
		// the same low priority waypoint over and over again.
		const altitudeTimer = flight.group.createItem("MCU_Timer");

		// TODO: Disable this altitude timer at some point?

		altitudeTimer.Time = rand.integer(25, 35);
		altitudeTimer.setPositionNear(coverCommand);

		coverCommand.addTarget(altitudeTimer);
		altitudeTimer.addTarget(coverCommand);
	}
	// Use cover command with airfield beacon
	else if (beacon) {

		coverCommand = flight.group.createItem("MCU_CMD_Cover");

		coverCommand.setPositionNear(beacon);
		coverCommand.addObject(leaderPlaneItem);
		coverCommand.addTarget(beacon.entity);

		coverCommand.Priority = Item.MCU_CMD_Cover.PRIORITY_LOW;
		coverCommand.CoverGroup = 0;
	}

	if (coverCommand) {
		input(coverCommand);
	}

	// Mark land action as a fake (don't generate commands, just the briefing)
	// NOTE: Cover airfield task does not use the common land plan action. All
	// planes will stay in the air and will land when out of fuel or ammunition
	// (as a direct result of "AI return to base decision" flag).
	flight.plan.land.makeAction = false;
}

// Make mission cover airfield plan briefing
function makeTaskCoverBriefing(action, flight) {

	const rand = this.rand;
	const playerElement = this.player.element;
	const isPlayerInLeadingElement = (playerElement === flight.elements[0]);
	const isPlayerFlightLeader = (flight.player === flight.leader);
	let isPlayerElementLeader = false;
	const briefing = [];
	const briefingIntro = [];

	if (playerElement.length > 1 && flight.player === this.player.element[0]) {
		isPlayerElementLeader = true;
	}
	
	// Draw cover area zone
	const airfield = this.airfields[flight.airfield];
	const startVector = Vector.create([airfield.position[0], airfield.position[2]]);
	let firstZoneIcon;
	let lastZoneIcon;
	
	// NOTE: Using three points to define encircled area around the airfield
	[0, 120, 240].forEach((degrees) => {
		
		let vector = Vector.create([4500 + rand.integer(0, 1000), 0]);
		const rotateRad = (degrees + rand.integer(-15, 15)) * (Math.PI / 180);
		
		// Build zone point vector
		vector = startVector.add(vector.rotate(rotateRad, Vector.Zero(2)));
		
		const zoneIcon = flight.group.createItem("MCU_Icon");
		
		zoneIcon.setPosition(vector.e(1), vector.e(2));
		zoneIcon.setColor(mapColor.ROUTE);
		zoneIcon.Coalitions = [flight.coalition];
		zoneIcon.LineType = Item.MCU_Icon.LINE_SECTOR_2;
		
		if (!firstZoneIcon) {
			firstZoneIcon = zoneIcon;
		}
		else {
			lastZoneIcon.addTarget(zoneIcon);
		}
		
		lastZoneIcon = zoneIcon;
	});
	
	// Connect zone icons in a loop
	lastZoneIcon.addTarget(firstZoneIcon);

	// Make intro segment
	if (flight.planes > 1) {

		let briefingLead = "";

		// Use flight formation name when player is a flight leader
		if (isPlayerFlightLeader) {
			briefingLead = "lead your {{{formation}}}";
		}
		// Use element sub-formation name when player is an element leader
		else if (isPlayerElementLeader) {
			briefingLead = "lead your {{{formation.element}}}";
		}
		// Link to AI element leader
		else if (!isPlayerInLeadingElement && playerElement.length > 1) {
			briefingLead = "follow your {{{formation.element}}} leader " + playerElement[0].pilot.id;
		}
		// Link to AI flight leader
		else {
			briefingLead = "follow your {{{formation}}} leader " + flight.leader.pilot.id;
		}

		briefingIntro.push(briefingLead);
	}

	briefingIntro.push(rand.pick(introSegments));

	briefing.push(briefingIntro.map((value) => {
		return makeBriefingText.call(this, value);
	}).join(" and "));

	// Add climb altitude briefing segment
	if (action.climbAltitude) {

		// TODO: Use feets for other countries?
		let altitudeStr = Math.round(action.climbAltitude / 100) * 100;
		altitudeStr = numeral(altitudeStr).format("0,0");

		briefing.push("Climb to " + altitudeStr + " meters altitude");
	}

	briefing.push(rand.pick(outroSegments));

	return briefing.map((value) => {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}).join(". ") + ".";
}