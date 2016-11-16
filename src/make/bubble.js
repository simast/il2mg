/** @copyright Simas Toleikis, 2016 */
"use strict";

const Quadtree = require("quadtree-lib");
const {PRECISION_POSITION} = require("../item");

// NOTE: The goal of a bubble system is to make sure that the least amount of
// check zone triggers are active in a mission at a given time. A quad tree is
// used to group normal check zone triggers into "parent" activity zones. As an
// example - if the player is on the left side of the map and there are two
// check zones active on the right - we can probably cover them both with a
// single check zone - which will only activate the other two when triggered!

// Time constants used to re-check bubble zone for activitity (in seconds)
const ZONE_TIME_CHECK = 30;
const ZONE_TIME_UNLOAD = 10;

// Generate mission activity bubble
module.exports = function makeBubble() {

	const {map} = this;
	const qt = new Quadtree({
		width: map.width,
		height: map.height,
		maxElements: 1 // TODO: Investigate best value
	});

	// Group used to hold all bubble related items
	let bubbleGroup;

	// Function used to create a new bubble activity zone
	// TODO: Support dynamic activity zones (with proximity trigger deactivation)
	this.createActivityZone = (params) => {

		const {point: [x, z], radius} = params;

		// Validate parameters
		if (x < 0 || x > map.height || z < 0 || z > map.width) {
			throw TypeError("Invalid activity zone parameters.");
		}

		const zone = Object.create(null);
		const x1 = Math.max(x - radius, 0);
		const z1 = Math.max(z - radius, 0);
		const x2 = Math.min(x + radius, map.height);
		const z2 = Math.min(z + radius, map.width);

		// Register new quadtree item
		// NOTE: Using different X/Z coordinate system compared to Quadtree lib!
		qt.push({
			x: z1,
			y: x1,
			width: z2 - z1,
			height: x2 - x1,
			zone
		});

		// Initialize base bubble group
		if (!bubbleGroup) {

			bubbleGroup = this.createItem("Group");
			bubbleGroup.setName("BUBBLE");
		}

		const zoneGroup = zone.group = bubbleGroup.createItem("Group");
		const checkZone = zoneGroup.createItem("MCU_CheckZone");
		const checkZoneActivate = zoneGroup.createItem("MCU_Activate");
		const checkZoneDeactivate = zoneGroup.createItem("MCU_Deactivate");
		const checkZoneCheck = zoneGroup.createItem("MCU_Timer");
		const checkZoneUnload = zoneGroup.createItem("MCU_Timer");
		const checkZoneLoad = zoneGroup.createItem("MCU_Timer");
		const checkZoneLoadActivate = zoneGroup.createItem("MCU_Activate");
		const checkZoneLoadDeactivate = zoneGroup.createItem("MCU_Deactivate");

		// Single check zone item used to track plane/vehicle activity
		// TODO: Also set VehicleCoalitions?
		checkZone.Zone = +(radius.toFixed(PRECISION_POSITION));
		checkZone.PlaneCoalitions = this.coalitions;
		checkZone.setPosition(x, z);
		checkZone.addTarget(checkZoneCheck);
		checkZone.addTarget(checkZoneUnload);
		checkZone.addTarget(checkZoneLoad);
		checkZone.addTarget(checkZoneDeactivate);

		// Check zone reactivation trigger
		checkZoneActivate.addTarget(checkZone);
		checkZoneActivate.setPositionNear(checkZone);

		// Check zone deactivation trigger
		checkZoneDeactivate.addTarget(checkZone);
		checkZoneDeactivate.setPositionNear(checkZone);

		// Timer used to re-check bubble zone for activity
		checkZoneCheck.Time = ZONE_TIME_CHECK;
		checkZoneCheck.addTarget(checkZoneActivate);
		checkZoneCheck.setPositionNear(checkZone);

		// Timer used to load activity zone
		checkZoneLoad.addTarget(checkZoneLoadDeactivate);
		checkZoneLoad.setPositionNear(checkZone);

		// Deactivate and reactivate load zone trigger (for a single "load" event)
		checkZoneLoadDeactivate.addTarget(checkZoneLoad);
		checkZoneLoadActivate.addTarget(checkZoneLoad);
		checkZoneLoadDeactivate.setPositionNear(checkZoneLoad);
		checkZoneLoadActivate.setPositionNear(checkZoneLoad);

		// Timer used to unload activity zone
		checkZoneUnload.Time = ZONE_TIME_CHECK + ZONE_TIME_UNLOAD;
		checkZoneUnload.addTarget(checkZoneLoadActivate);
		checkZoneUnload.setPositionNear(checkZone);

		// Expose public zone event items
		zone.onCheck = checkZone;
		zone.onLoad = checkZoneLoad;
		zone.onUnload = checkZoneUnload;

		// Lazy onActivate event item (triggered when zone is loaded)
		Object.defineProperty(zone, "onActivate", {
			get: function() {

				const onActivate = zoneGroup.createItem("MCU_Activate");

				checkZoneLoad.addTarget(onActivate);
				onActivate.setPositionNear(checkZoneLoad);

				delete this.onActivate;
				this.onActivate = onActivate;

				return onActivate;
			},
			configurable: true
		});

		// Lazy onDeactivate event item (triggered when zone is unloaded)
		Object.defineProperty(zone, "onDeactivate", {
			get: function() {

				const onDeactivate = zoneGroup.createItem("MCU_Deactivate");

				checkZoneUnload.addTarget(onDeactivate);
				onDeactivate.setPositionNear(checkZoneUnload);

				delete this.onDeactivate;
				this.onDeactivate = onDeactivate;

				return onDeactivate;
			},
			configurable: true
		});

		// Lazy onInitialize event item (triggered when zone is intialized)
		Object.defineProperty(zone, "onInitialize", {
			get: function() {

				const onInitialize = zoneGroup.createItem("MCU_Counter");

				checkZone.addTarget(onInitialize);
				onInitialize.setPositionNear(checkZone);

				delete this.onInitialize;
				this.onInitialize = onInitialize;

				return onInitialize;
			},
			configurable: true
		});

		return zone;
	};

	// Build bubble activity zones
	this.make.push(() => {

		if (!qt.size) {
			return;
		}

		// Process each quadtree node
		const walkQuadtree = (node, zone) => {

			const items = node.oversized.concat(node.contents);
			let needsCoverZone = false;

			// Cover zone is only relevant to non-root nodes
			if (node !== qt) {

				// Always cover if we have more than one immediate item
				if (items.length > 1) {
					needsCoverZone = true;
				}
				// Also cover if we have more than one child tree
				else {

					let numChildNodes = 0;

					for (const direction in node.children) {

						if (node.children[direction].tree) {

							numChildNodes++;

							if (numChildNodes > 1) {

								needsCoverZone = true;
								break;
							}
						}
					}
				}
			}

			// Create node activity cover zone
			if (needsCoverZone) {

				// NOTE: Radius needs to cover entire node rectangular sector!
				let radius = Math.max(node.width, node.height) / 2;
				radius = Math.sqrt(Math.pow(radius, 2) + Math.pow(radius, 2));

				const coverZone = this.createActivityZone({
					point: [
						node.y + node.height / 2,
						node.x + node.width / 2
					],
					radius
				});

				zone.onLoad.addTarget(coverZone.onCheck);
				zone = coverZone;
			}

			// Connect each activity zone to covering zone
			for (const item of items) {
				zone.onLoad.addTarget(item.zone.onCheck);
			}

			// There won't be any more items in child nodes
			if (items.length >= node.size) {
				return;
			}

			// Walk each child node tree
			for (const direction in node.children) {

				const childNode = node.children[direction].tree;

				if (childNode) {
					walkQuadtree(childNode, zone);
				}
			}
		};

		// Initialize base mission start trigger (used to activate bubble logic)
		const missionBegin = bubbleGroup.createItem("MCU_TR_MissionBegin");
		const missionBeginTimer = bubbleGroup.createItem("MCU_Timer");

		missionBegin.setPosition(qt.height / 2, qt.width / 2);
		missionBegin.addTarget(missionBeginTimer);
		missionBeginTimer.setPositionNear(missionBegin);
		missionBeginTimer.Time = 2; // NOTE: Required!

		walkQuadtree(qt, {
			onLoad: missionBeginTimer
		});
	});
};