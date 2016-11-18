/** @copyright Simas Toleikis, 2016 */
"use strict";

const Quadtree = require("quadtree-lib");
const addLazyProperty = require("lazy-property");
const encloseCircles = require("circle-enclose");
const {PRECISION_POSITION} = require("../item");

// NOTE: The goal of a bubble system is to make sure that the least amount of
// check zone triggers are active in a mission at a given time. A quad tree is
// used to group normal check zone triggers into "parent" activity zones. As an
// example - if the player is on the left side of the map and there are two
// check zones active on the right - we can probably cover them both with a
// single check zone - which will only activate the other two when triggered!

// Time constants used to re-check bubble zone for activitity (in seconds)
const ZONE_TIME_CHECK_MIN = 40;
const ZONE_TIME_CHECK_MAX = 50;
const ZONE_TIME_UNLOAD = 10;

// Generate mission activity bubble
module.exports = function makeBubble() {

	const {rand, map} = this;

	// Initialize Quadtree structure for current map size
	const qt = new Quadtree({
		width: map.width,
		height: map.height,
		maxElements: 1 // TODO: Investigate best value
	});

	// Group used to hold all bubble related items
	let bubbleGroup;

	// Function used to create a new bubble activity zone
	// TODO: Support dynamic activity zones (with proximity trigger deactivation)
	this.createActivityZone = (params, isCoverZone = false) => {

		const {point: [x, z], radius} = params;

		// Validate parameters
		if (x < 0 || x > map.height || z < 0 || z > map.width || !radius) {
			throw TypeError("Invalid activity zone parameters.");
		}

		// Public activity zone interface
		const zone = Object.create(params);

		// Register new quadtree item
		if (!isCoverZone) {

			const x1 = Math.max(x - radius, 0);
			const z1 = Math.max(z - radius, 0);
			const x2 = Math.min(x + radius, map.height);
			const z2 = Math.min(z + radius, map.width);

			// NOTE: Using different X/Z coordinate system compared to Quadtree lib!
			qt.push({
				x: z1,
				y: x1,
				width: z2 - z1,
				height: x2 - x1,
				zone
			});
		}

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
		// NOTE: The player might start in an area covered by multiple zones - and
		// they will all get activated at the same time. As a result - we randomize
		// bubble zone re-check time slightly to distribute the load.
		const checkTime = +(rand.real(
			ZONE_TIME_CHECK_MIN,
			ZONE_TIME_CHECK_MAX,
			true
		).toFixed(3));

		checkZoneCheck.Time = checkTime;
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
		checkZoneUnload.Time = checkTime + ZONE_TIME_UNLOAD;
		checkZoneUnload.addTarget(checkZoneLoadActivate);
		checkZoneUnload.setPositionNear(checkZone);

		// Expose public zone event items
		zone.onCheck = checkZone;
		zone.onCheckActivate = checkZoneActivate;
		zone.onCheckDeactivate = checkZoneDeactivate;
		zone.onLoad = checkZoneLoad;
		zone.onUnload = checkZoneUnload;

		// Lazy onActivate event item (triggered when zone is loaded)
		addLazyProperty(zone, "onActivate", () => {

			const onActivate = zoneGroup.createItem("MCU_Activate");

			checkZoneLoad.addTarget(onActivate);
			onActivate.setPositionNear(checkZoneLoad);

			return onActivate;
		});

		// Lazy onDeactivate event item (triggered when zone is unloaded)
		addLazyProperty(zone, "onDeactivate", () => {

			const onDeactivate = zoneGroup.createItem("MCU_Deactivate");

			checkZoneUnload.addTarget(onDeactivate);
			onDeactivate.setPositionNear(checkZoneUnload);

			return onDeactivate;
		});

		// Lazy onInitialize event item (triggered when zone is intialized)
		addLazyProperty(zone, "onInitialize", () => {

			const onInitialize = zoneGroup.createItem("MCU_Counter");

			checkZone.addTarget(onInitialize);
			onInitialize.setPositionNear(checkZone);

			return onInitialize;
		});

		// TODO: Add lazy onEffectStart/onAttackArea event items?

		return zone;
	};

	// Build bubble activity zones
	this.make.push(() => {

		if (!qt.size) {
			return;
		}

		// Process each quadtree node
		const walkQuadtree = (node) => {

			const items = node.oversized.concat(node.contents);
			const zones = [];

			// Register immediate item zones
			for (const item of items) {
				zones.push(item.zone);
			}

			// Walk each child quadrant tree
			if (items.length < node.size) {

				for (const quadrantType in node.children) {

					const childNode = node.children[quadrantType].tree;

					if (childNode) {
						zones.push.apply(zones, walkQuadtree(childNode));
					}
				}
			}

			// Cover multiple zones with a single parent activity zone
			if (node !== qt && zones.length > 1) {

				const circles = [];

				// Build a list of zone circles
				for (const zone of zones) {

					circles.push({
						x: zone.point[0],
						y: zone.point[1],
						r: zone.radius
					});
				}

				// Get circle used as cover zone (solves smallest-circle problem)
				const coverCircle = encloseCircles(circles);

				// Create a parent activity cover zone
				const coverZone = this.createActivityZone({
					point: [coverCircle.x, coverCircle.y],
					radius: coverCircle.r
				}, true);

				// Connect each zone to parent activity cover zone
				for (const zone of zones) {

					// Activate child zone when parent cover zone is loaded
					coverZone.onLoad.addTarget(zone.onCheck);

					// Also deactivate child zone when parent cover zone is unloaded
					coverZone.onUnload.addTarget(zone.onCheckDeactivate);
					coverZone.onLoad.addTarget(zone.onCheckActivate);
				}

				// NOTE: All items are now covered with a single cover zone
				return [coverZone];
			}

			return zones;
		};

		const zones = walkQuadtree(qt);

		if (zones.length) {

			// Initialize base mission start trigger (used to activate bubble logic)
			const missionBegin = bubbleGroup.createItem("MCU_TR_MissionBegin");
			const missionBeginTimer = bubbleGroup.createItem("MCU_Timer");

			missionBegin.setPosition(qt.height / 2, qt.width / 2);
			missionBegin.addTarget(missionBeginTimer);
			missionBeginTimer.setPositionNear(missionBegin);
			missionBeginTimer.Time = 2; // NOTE: Required!

			for (const zone of zones) {
				missionBeginTimer.addTarget(zone.onCheck);
			}
		}
	});
};