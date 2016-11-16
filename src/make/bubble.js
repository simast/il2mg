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

	// Function used to register a new bubble activity zone
	// TODO: Support dynamic activity zones (with proximity trigger deactivation)
	this.registerActivityZone = (params) => {

		const {point: [x, z], radius} = params;

		// Validate parameters
		if (x < 0 || x > map.height || z < 0 || z > map.width) {
			throw TypeError("Invalid activity zone parameters.");
		}

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
			params: params
		});
	};

	// Build registered bubble activity zones
	this.make.push(() => {

		if (!qt.size) {
			return;
		}

		const bubbleGroup = this.createItem("Group");
		bubbleGroup.setName("BUBBLE");

		// Create a new bubble activity zone
		const createActivityZone = (params, coverZone) => {

			const {
				point, // Zone center point (X/Z position)
				radius, // Zone radius
				onLoad = [], // List of items to trigger when zone is loaded
				onActivate = [], // List of items to activate when zone is loaded
				onUnload = [], // List of items to trigger when zone is unloaded
				onDeactivate = [] // List of items to deactivate when zone is loaded
			} = params;

			const checkZone = bubbleGroup.createItem("MCU_CheckZone");
			const checkZoneActivate = bubbleGroup.createItem("MCU_Activate");
			const checkZoneDeactivate = bubbleGroup.createItem("MCU_Deactivate");
			const checkZoneCheck = bubbleGroup.createItem("MCU_Timer");
			const checkZoneUnload = bubbleGroup.createItem("MCU_Timer");
			const checkZoneLoad = bubbleGroup.createItem("MCU_Timer");
			const checkZoneLoadActivate = bubbleGroup.createItem("MCU_Activate");
			const checkZoneLoadDeactivate = bubbleGroup.createItem("MCU_Deactivate");

			// Single check zone item used to track plane/vehicle activity
			checkZone.Zone = +(radius.toFixed(PRECISION_POSITION));
			checkZone.setPosition(...point);
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

			// Connect this new activity zone to parent cover zone
			coverZone.onLoad.addTarget(checkZone);

			// Connect onLoad event items
			for (const onLoadItem of onLoad) {
				checkZoneLoad.addTarget(onLoadItem);
			}

			// Connect onActivate event items
			if (onActivate.length) {

				const onLoadActivate = bubbleGroup.createItem("MCU_Activate");

				checkZoneLoad.addTarget(onLoadActivate);
				onLoadActivate.setPositionNear(checkZoneLoad);

				for (const onActivateItem of onActivate) {
					onLoadActivate.addTarget(onActivateItem);
				}
			}

			// Connect onUnload event items
			for (const onUnloadItem of onUnload) {
				checkZoneUnload.addTarget(onUnloadItem);
			}

			// Connect onDeactivate event items
			if (onDeactivate.length) {

				const onUnloadDeactivate = bubbleGroup.createItem("MCU_Deactivate");

				checkZoneUnload.addTarget(onUnloadDeactivate);
				onUnloadDeactivate.setPositionNear(checkZoneUnload);

				for (const onDeactivateItem of onDeactivate) {
					onUnloadDeactivate.addTarget(onDeactivateItem);
				}
			}

			return {
				onLoad: checkZoneLoad
			};
		};

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

				zone = createActivityZone({
					point: [
						node.y + node.height / 2,
						node.x + node.width / 2
					],
					radius
				}, zone);
			}

			// Create activity zone for each item
			for (const item of items) {
				createActivityZone(item.params, zone);
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

		// Initialize base Mission Begin trigger (used to activate bubble logic)
		const missionBegin = bubbleGroup.createItem("MCU_TR_MissionBegin");
		missionBegin.setPosition(qt.height / 2, qt.width / 2);

		walkQuadtree(qt, {
			onLoad: missionBegin
		});
	});
};