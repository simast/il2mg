/** @copyright Simas Toleikis, 2015 */
"use strict";

const Location = require("./locations").Location;
const MCU_Icon = require("../item").MCU_Icon;

// Data constants
const frontLine = DATA.frontLine;
const mapColor = DATA.mapColor;
const territory = DATA.territory;
const coalition = DATA.coalition;

// Map grid size
// NOTE: Territories will be more precise with smaller grid size
const GRID_SIZE = 5000; // 5 km
const GRID_SIZE_HALF = GRID_SIZE / 2;

// Generate mission fronts and territories
module.exports = function makeFronts() {
	
	const mission = this;
	
	// Territories X/Z grid
	const territories = new Map();
	
	// Location index for front points
	const locationsFronts = this.locations.fronts = new Location.Index();
	
	// Location indexes for territories (by coalition)
	const locationsTerritories = this.locations.territories = Object.create(null);
	
	this.coalitions.forEach((coalitionID) => {
		locationsTerritories[coalitionID] = new Location.Index();
	});
	
	// Resolve required fronts file based on mission date
	const frontsFile = this.battle.fronts[this.date.format("YYYY-MM-DD")];

	if (!frontsFile) {
		return;
	}
	
	// Set debug mode flag
	let debugFronts = false;
	
	if (mission.debug && mission.debug.fronts) {
		debugFronts = true;
	}

	// Load fronts data file
	// TODO: Move to data.js?
	const frontsPath = "../../data/battles/" + this.battleID + "/fronts/";
	const frontsData = require(frontsPath + frontsFile);
	
	if (!frontsData || !frontsData.length) {
		return;
	}

	// Front icons group
	const frontsGroup = this.createItem("Group");
	frontsGroup.setName("FRONT");

	// Index of created point icons
	const pointItems = new Map();
	
	// Index of front border lines (per grid X/Z dimension) used for ray tracing
	const rayLines = {
		x: new Map(),
		z: new Map()
	};
	
	// Max coordinates for the territories grid
	const gridMax = {
		x: Math.floor(this.map.height / GRID_SIZE),
		z: Math.floor(this.map.width / GRID_SIZE)
	};
	
	// List of found front point locations
	const frontPointLocations = [];

	// Process front points
	for (let pointID = 0; pointID < frontsData.length; pointID++) {
		makeFrontPoint(pointID);
	}
	
	// Build territories grid and location indexes
	makeTerritories.call(this);
	
	// Load found front points into locations index
	locationsFronts.load(frontPointLocations);

	// Make front point icon item
	function makeFrontPoint(pointID) {

		// Point item is already created
		if (pointItems.has(pointID)) {
			return;
		}

		const point = frontsData[pointID];
		const pointType = point[0];
		const pointX = point[1];
		const pointZ = point[2];
		const pointTargets = point[3];
		const pointItem = frontsGroup.createItem("MCU_Icon");

		pointItem.setPosition(pointX, pointZ);
		pointItem.Coalitions = mission.coalitions;

		// Front border line
		if (pointType === frontLine.BORDER) {
			
			pointItem.LineType = MCU_Icon.LINE_POSITION_0;
			
			// Show icons on front border points in debug mode
			if (debugFronts) {
				pointItem.IconId = MCU_Icon.ICON_WAYPOINT;
			}
			
			// TODO: Follow bezier curves and generate more points for precision?
			frontPointLocations.push(new Location(pointX, pointZ));
			
			// Set territory grid to the front line type
			const gridX = Math.floor(pointX / GRID_SIZE);
			const gridZ = Math.floor(pointZ / GRID_SIZE);
			
			if (gridX >= 0 && gridZ >= 0 && gridX <= gridMax.x && gridZ <= gridMax.z) {
			
				const territoriesZ = territories.get(gridX) || new Map();
				
				territoriesZ.set(gridZ, {type: territory.FRONT});
				territories.set(gridX, territoriesZ);
			}
		}
		// Attack arrow
		else if (pointType === frontLine.ATTACK) {

			pointItem.LineType = MCU_Icon.LINE_ATTACK;
			pointItem.setColor(mapColor.ATTACK);
		}

		// Index point icon item
		pointItems.set(pointID, pointItem);

		// Connect point items with target links
		if (pointTargets) {
			
			for (const targetID of pointTargets) {
				
				// Target item is not yet created
				if (!pointItems.has(targetID)) {
					makeFrontPoint(targetID);
				}
				
				const targetItem = pointItems.get(targetID);
				
				pointItem.addTarget(targetItem);
				
				// Index front border lines per grid dimension (used for ray tracing)
				if (pointType === frontLine.BORDER) {
					
					// Line used for ray intersection checks
					let line;
					
					const linePos1 = {x: pointItem.XPos, z: pointItem.ZPos};
					const linePos2 = {x: targetItem.XPos, z: targetItem.ZPos};
					
					const gridFrom = {
						x: Math.floor(Math.min(linePos1.x, linePos2.x) / GRID_SIZE),
						z: Math.floor(Math.min(linePos1.z, linePos2.z) / GRID_SIZE)
					};
					
					const gridTo = {
						x: Math.floor(Math.max(linePos1.x, linePos2.x) / GRID_SIZE),
						z: Math.floor(Math.max(linePos1.z, linePos2.z) / GRID_SIZE)
					};
					
					// Index line for each grid dimension
					["x", "z"].forEach((dimension) => {
						
						for (let c = gridFrom[dimension]; c <= gridTo[dimension]; c++) {
							
							// Rays will be cast over the center of the grid coordinate space
							const rayPos = (c * GRID_SIZE) + GRID_SIZE_HALF;
							
							// Skip border lines that we know will not intersect with the ray
							if ((linePos1[dimension] >= rayPos && linePos2[dimension] >= rayPos) ||
									(linePos1[dimension] <= rayPos && linePos2[dimension] <= rayPos)) {
								
								continue;
							}
							
							const lineList = rayLines[dimension].get(c) || [];
							
							// Use the same line object for all grid items
							if (!line) {
								
								line = $L(
									[linePos1.x, 0, linePos1.z],
									[linePos2.x - linePos1.x, 0, linePos2.z - linePos1.z]
								);
							}
							
							lineList.push(line);
							rayLines[dimension].set(c, lineList);
						}
					});
				}
			}
		}
	}
	
	// Make territories
	function makeTerritories() {
		
		// Run ray tracing over each map dimension (for precision)
		["x", "z"].forEach((dimension) => {
			
			if (!rayLines[dimension].size) {
				return;
			}
			
			const isXDimension = (dimension === "x");
			
			// Dimension and ray coordinate indexes
			const axisIndexDimension = (isXDimension ? 0 : 2);
			const axisIndexRay = (isXDimension ? 2 : 0);
			
			// Max grid coordinate value on the ray axis
			const maxRayGrid = (isXDimension ? gridMax.z : gridMax.x);
			
			// Invert front line facing direction for Z dimension
			const faceInvert = (isXDimension ? 1 : -1);
			
			rayLines[dimension].forEach((lineList, c) => {
				
				const intersections = [];
				
				// Rays are cast over the center of the grid coordinate space
				const rayPos = (c * GRID_SIZE) + GRID_SIZE_HALF;
				
				// Create infinite ray line used for intersection tests
				const rayLineAnchor = [0, 0, 0];
				const rayLineDirection = [0, 0, 0];
				
				rayLineAnchor[axisIndexDimension] = rayPos;
				rayLineDirection[axisIndexRay] = 1;
				
				const rayLine = $L(rayLineAnchor, rayLineDirection);
				
				// Check for valid intersections
				for (const line of lineList) {
					
					const intersectionPoint = rayLine.intersectionWith(line);
					
					if (!intersectionPoint) {
						continue;
					}
					
					intersections.push({
						point: intersectionPoint,
						face: line.direction.e(axisIndexDimension + 1) * faceInvert
					});
				}
				
				if (!intersections.length) {
					return;
				}
				
				// Sort intersection point list based on ascending ray axis position
				intersections.sort((a, b) => {
					return a.point.e(axisIndexRay + 1) - b.point.e(axisIndexRay + 1);
				});
				
				const territoriesRanges = [];
				let gridFrom = 0;
				let coalitionID;
				
				// Build territory ranges on the ray axis based on intersection data
				for (const intersection of intersections) {
					
					const intersectionCoord = intersection.point.e(axisIndexRay + 1);
					const gridTo = Math.floor(intersectionCoord / GRID_SIZE);
					
					// NOTE: Front lines in the game seems to be always rendered with
					// allies side on the right and axis side on the left.
					coalitionID = (intersection.face > 0 ? coalition.AXIS : coalition.ALLIES);
					
					// Mark territory before the front line intersection
					territoriesRanges.push({
						from: gridFrom,
						to: gridTo - 2,
						type: coalitionID
					});

					// Mark front territory (with +-1 grid point around the collision zone)
					territoriesRanges.push({
						from: gridTo - 1,
						to: gridTo + 1,
						type: territory.FRONT
					});
					
					gridFrom = gridTo + 2;
				}
				
				// Add closing/final territory line (to the end of the map)
				if (gridFrom <= maxRayGrid) {

					territoriesRanges.push({
						from: gridFrom,
						to: maxRayGrid,
						// Invert coalition side for the final range
						type: (coalitionID === coalition.ALLIES ? coalition.AXIS : coalition.ALLIES)
					});
				}
				
				// Set identified territories to the grid
				territoriesRanges.forEach((range) => {
					
					const rangeFrom = Math.max(range.from, 0);
					const rangeTo = Math.min(range.to, maxRayGrid);
					
					// NOTE: Territory grid contains references to a shared object holding
					// the type value (done for performance reasons to minimize iterations).
					const rangeType = {
						type: range.type
					};

					for (let i = rangeFrom; i <= rangeTo; i++) {
						
						// Invert dimension coordinates for Z axis ray tracing
						let c1 = (isXDimension ? c : i);
						let c2 = (isXDimension ? i : c);
						
						const territoriesAxis = territories.get(c1) || new Map();
						const existingType = territoriesAxis.get(c2);
						
						// Keep existing territories (from previous ray cast) - only front
						// line territories are always overridden.
						if (existingType === undefined || range.type === territory.FRONT) {
							
							territoriesAxis.set(c2, rangeType);
							territories.set(c1, territoriesAxis);
						}
					}
				});
			});
		});
		
		// Initial ray tracing did not find any territories
		if (!territories.size) {
			return;
		}
		
		// Mark remaining territory gaps (that were not detected by ray tracing)
		const gapPoints = [];
		let gapType = null;
		
		for (let x = 0; x <= gridMax.x; x++) {
			
			let territoriesZ = territories.get(x);
			
			// Initialize missing Z territories axis
			if (!territoriesZ) {
				
				territoriesZ = new Map();
				territories.set(x, territoriesZ);
			}
			
			let z = (x % 2 === 0 ? 0 : gridMax.z);
			
			// Alternate iteration over the Z axis
			while (z >= 0 && z <= gridMax.z) {
				
				let point = territoriesZ.get(z);
				
				if (point && point.type > 0) {
					gapType = point.type;
				}
				else if (!point) {
					
					point = {};
					
					gapPoints.push(point);
					territoriesZ.set(z, point);
				}
				
				if (gapType) {
					
					while (gapPoints.length) {
						
						const gapPoint = gapPoints.shift();
						gapPoint.type = gapType;
					}
				}
				
				// Iterate Z
				z = (x % 2 === 0 ? z + 1 : z - 1);
			}
		}
		
		
		if (!debugFronts) {
			return;
		}
		
		// Draw a territory line in the debug mode output
		const drawDebugLine = (posFrom, posTo, color) => {
		
			const lineItemFrom = frontsGroup.createItem("MCU_Icon");
			const lineItemTo = frontsGroup.createItem("MCU_Icon");

			lineItemFrom.setPosition(posFrom);
			lineItemTo.setPosition(posTo);
			
			lineItemFrom.LineType = MCU_Icon.LINE_SECTOR_2;

			lineItemFrom.Coalitions = this.coalitions;
			lineItemTo.Coalitions = this.coalitions;

			lineItemFrom.setColor(color);
			lineItemTo.setColor(color);
			
			lineItemFrom.addTarget(lineItemTo);
		};
		
		// Paint territory ranges with debug lines
		this.make.push(() => {
			
			const playerCoalitionID = DATA.countries[this.player.flight.country].coalition;
			
			territories.forEach((territoriesZ, x) => {
				
				const posX = (x * GRID_SIZE) + GRID_SIZE_HALF;
				
				let type = null;
				let posFrom = null;
				let posTo = null;
				let color = null;
				
				// NOTE: Overflowing Z axis with +1 (to draw the closing line)
				for (let z = 0; z <= gridMax.z + 1; z++) {
					
					let point = territoriesZ.get(z);
					
					if (!point || (type !== null && point.type !== type)) {
						
						if (type !== null) {
							
							if (color) {
								drawDebugLine(posFrom, posTo, color);
							}
							
							type = posFrom = posTo = color = null;
						}
						
						if (!point) {
							continue;
						}
					}
					
					type = point.type;
					
					// Draw lines only for coalition territories
					if (type <= 0) {
						continue;
					}
					
					if (!posFrom) {
						posFrom = [posX, 0, z * GRID_SIZE];
					}

					posTo = [posX, 0, (z * GRID_SIZE) + GRID_SIZE];
					
					if (!color) {
						
						color = mapColor.ENEMY;
						
						if (type === playerCoalitionID) {
							color = mapColor.FRIEND;
						}
					}
				}
			});
		});
	}
};