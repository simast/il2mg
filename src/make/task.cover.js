/** @copyright Simas Toleikis, 2015 */
"use strict";

const numeral = require("numeral");
const {MCU_Waypoint, MCU_CMD_Cover} = require("../item");
const {markMapArea} = require("./map");
const {makeActivity} = require("./flight.plan");
const makeBriefingLead = require("./briefing.lead");
const makeFlightSpeed = require("./flight.speed");
const makeFlightFuel = require("./flight.fuel");

// Min/max percent of max flight fuel range used as cover activity distance
const MIN_COVER_RANGE_RATIO = 0.5; // 50%
const MAX_COVER_RANGE_RATIO = 0.7; // 70%

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

	const {rand, weather} = this;

	// Cover activity flight distance is based on max flight range
	const distance = flight.range * rand.real(
		MIN_COVER_RANGE_RATIO,
		MAX_COVER_RANGE_RATIO,
		true
	);

	// Make cover activity flight speed
	const speed = makeFlightSpeed.call(this, flight);

	// Custom cover airfield plan activity
	const activity = makeActivity.call(this, flight, {
		makeAction: makeTaskCoverAction,
		makeState: makeTaskCoverState,
		makeBriefing: makeTaskCoverBriefing,
		makeTime: makeTaskCoverTime,
		makeVirtualPoints: makeTaskCoverVirtualPoints,
		distance,
		speed
	});

	// Only climb above airfield with low cloud cover
	if (weather.clouds.cover < 50) {
		activity.altitude = rand.integer(1200, 2200);
	}

	flight.plan.push(activity);
};

// Make mission cover airfield plan action
function makeTaskCoverAction(element, input) {

	if (!input) {
		return;
	}

	const {mission, flight} = this;
	const leaderElement = flight.elements[0];

	// Process cover action only for leading element
	if (element !== leaderElement) {
		return;
	}

	const {rand} = mission;
	const airfield = mission.airfields[flight.airfield];
	const leaderPlaneItem = element[0].item;
	const beacon = airfield.beacon;

	let coverCommand = this.coverCommand;

	if (!coverCommand) {

		// Use climb waypoint above the airfield as a cover command
		if (this.altitude) {

			coverCommand = flight.group.createItem("MCU_Waypoint");

			coverCommand.Area = rand.integer(75, 125);
			coverCommand.Speed = this.speed;
			coverCommand.Priority = MCU_Waypoint.PRIORITY_LOW;

			// Set waypoint position above the airfield
			coverCommand.setPosition(
				airfield.position[0] + rand.pick([-1, 1]) * rand.integer(200, 600),
				this.altitude,
				airfield.position[2] + rand.pick([-1, 1]) * rand.integer(200, 600)
			);

			// NOTE: The waypoint command is a cylinder and not a sphere. To make flights
			// actually reach required waypoint altitude and not to abort on first pass
			// below the waypoint - we use a trick with a timer that keeps activating
			// the same low priority waypoint over and over again.
			const altitudeTimer = flight.group.createItem("MCU_Timer");

			// TODO: Disable this altitude timer at some point?

			altitudeTimer.Time = rand.integer(30, 40);
			altitudeTimer.setPositionNear(coverCommand);

			coverCommand.addTarget(altitudeTimer);
			altitudeTimer.addTarget(coverCommand);
		}
		// Use cover command with airfield beacon
		else if (beacon) {

			coverCommand = flight.group.createItem("MCU_CMD_Cover");

			coverCommand.setPositionNear(beacon);
			coverCommand.addTarget(beacon.entity);

			coverCommand.Priority = MCU_CMD_Cover.PRIORITY_LOW;
			coverCommand.CoverGroup = 0;
		}

		this.coverCommand = coverCommand;
	}

	if (coverCommand) {

		coverCommand.addObject(leaderPlaneItem);
		input(coverCommand);
	}

	// Mark land action as a fake (don't generate commands, just the briefing)
	// NOTE: Cover airfield task does not use the common land plan action. All
	// planes will stay in the air and will land when out of fuel or ammunition
	// (as a direct result of "AI return to base decision" flag).
	flight.plan.land.makeAction = false;
}

// Make cover airfield activity state
function makeTaskCoverState(time) {

	const {mission, flight, distance} = this;
	const {plan} = flight;
	const {rand} = mission;
	const state = time / this.time;
	const airfield = mission.airfields[flight.airfield];
	const usedDistance = (distance * state);

	// Use flight fuel for fast-forward cover distance
	makeFlightFuel.call(mission, flight, usedDistance);

	// Fast-forward to required altitude
	if (this.altitude) {

		flight.plan.start.position = [
			airfield.position[0] + rand.pick([-1, 1]) * rand.integer(200, 600),
			this.altitude,
			airfield.position[2] + rand.pick([-1, 1]) * rand.integer(200, 600)
		];
	}

	// Adjust remaining cover activity distance based on state
	this.distance = distance - usedDistance;

	// Remove activity from plan
	if (state >= 1) {
		plan.splice(plan.indexOf(this), 1);
	}
}

// Make cover airfield activity briefing
function makeTaskCoverBriefing() {

	const {mission, flight} = this;
	const {rand} = mission;
	const airfield = mission.airfields[flight.airfield];
	const briefing = [];

	// Draw cover area zone
	markMapArea.call(mission, flight, {
		position: airfield.position
	});

	// Make intro segment
	const briefingIntro = makeBriefingLead.call(mission, flight);

	if (briefingIntro.length < 2) {
		briefingIntro.push(rand.pick(introSegments));
	}

	briefing.push(briefingIntro.join(" and "));

	// Add climb altitude briefing segment
	if (this.altitude) {

		// TODO: Use feets for other countries?
		let altitudeStr = Math.round(this.altitude / 100) * 100;
		altitudeStr = numeral(altitudeStr).format("0,0");

		briefing.push("Climb to [" + altitudeStr + " meters] altitude");
	}

	briefing.push(rand.pick(outroSegments));

	return briefing.map((value) => {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}).join(". ") + ".";
}

// Make cover airfield activity time
function makeTaskCoverTime() {
	return this.distance / (this.speed * 1000 / 3600);
}

// Make cover airfield activity virtual points count
function makeTaskCoverVirtualPoints() {

	// Create 1 virtual cover point for every ~15 minutes in the air
	return Math.round(this.time / (15 * 60));
}