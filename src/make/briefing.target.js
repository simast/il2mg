import numeral from "numeral"
import sylvester from "sylvester"
import {Location, LocationType} from "./locations"

// Briefing map grid size
const GRID_SIZE = 10000 // 10 km

// Place selection max radius
const PLACE_RADIUS = 5000 // 5 Km

// Names of location place types
const placeTypeNames = {
	[LocationType.Village]: "village",
	[LocationType.Town]: "town",
	[LocationType.City]: "city",
	[LocationType.Airfield]: "airfield"
}

// Make briefing target/location description
export default function makeBriefingTarget(target) {

	if (!Array.isArray(target) || !target.length) {
		return
	}

	// Can only make location description for max two target points
	if (target.length > 2) {
		target = target.slice(0, 2)
	}

	const {Vector} = sylvester
	const isSingleTarget = (target.length < 2)
	const locations = this.locations
	const targetPlaces = []

	// Process each location target point
	target.forEach((point, index) => {

		targetPlaces[index] = point

		let foundPlaces = []
		const pointLocation = new Location(
			point[0] - PLACE_RADIUS,
			point[1] - PLACE_RADIUS,
			point[0] + PLACE_RADIUS,
			point[1] + PLACE_RADIUS
		)

		// Find all interesting places and airfields around the target point
		;[locations.places, locations.airfields].forEach(locationIndex => {
			foundPlaces = foundPlaces.concat(locationIndex.findIn(pointLocation))
		})

		if (!foundPlaces.length) {
			return
		}

		const targetVector = Vector.create(point)

		// Filter out places outside max place radius and/or with bad names
		foundPlaces = foundPlaces.filter(place => {

			// Place has to have a valid name (without digits and other punctuation)
			if (!place.name || (!isSingleTarget && /[^A-Za-z\s-]/.test(place.name))) {
				return false
			}

			return (targetVector.distanceFrom(place.vector) <= PLACE_RADIUS)
		})

		if (foundPlaces.length) {

			// Sort found places based on the distance from target point
			foundPlaces.sort((a, b) => {

				const distanceA = targetVector.distanceFrom(a.vector)
				const distanceB = targetVector.distanceFrom(b.vector)

				return distanceA - distanceB
			})

			// Use closest found place
			targetPlaces[index] = foundPlaces[0]
		}
	})

	const briefing = []

	// Target place as two locations
	if (targetPlaces.length > 1) {
		briefing.push("between")
	}

	const placeNames = []
	let isPlaceTypeCombined = false

	targetPlaces.forEach((place, placeIndex) => {

		let fullPlaceName = ""
		let placeName = place.name

		// Highlight target place (with single target only)
		if (isSingleTarget) {
			placeName = "[" + placeName + "]"
		}

		// Use location name
		if (place instanceof Location) {

			if (!isPlaceTypeCombined) {

				const nextPlace = targetPlaces[placeIndex + 1]
				let placeType = placeTypeNames[place.type]

				if (placeType) {

					const combinedLocationTypes = [
						LocationType.Village,
						LocationType.Town,
						LocationType.Airfield
					]

					// Combine same village/town place types into a single type description
					if (nextPlace instanceof Location && nextPlace.type === place.type &&
						combinedLocationTypes.indexOf(place.type) !== -1) {

						placeType += "s"
						isPlaceTypeCombined = true
					}

					// Custom output for non-combined airfield locations (without "of")
					if (!isPlaceTypeCombined && place.type === LocationType.Airfield) {
						fullPlaceName += placeName + " " + placeType
					}
					else {

						if (!nextPlace) {
							fullPlaceName += "the "
						}

						fullPlaceName += placeType + " of " + placeName
					}
				}
			}
			else {
				fullPlaceName += placeName
			}
		}
		// Use map grid reference as a place name
		else {

			// NOTE: Map grid is based on top/left coordinate space
			const gridX = 1 + ((this.map.height - place[0]) / GRID_SIZE)
			const gridZ = 1 + (place[1] / GRID_SIZE)

			// Each grid is sub-divided into 9 smaller sub-grids
			const subgridSize = Math.sqrt(9)
			const subgridX = (1 - (gridX % 1)) * subgridSize
			const subgridZ = (gridZ % 1) * subgridSize
			const subgrid = (Math.floor(subgridX) * subgridSize) + 1 + Math.floor(subgridZ)

			fullPlaceName = "grid "
			fullPlaceName += ("00" + Math.floor(gridX)).substr(-2, 2)
			fullPlaceName += ("00" + Math.floor(gridZ)).substr(-2, 2)

			// NOTE: Subgrid number 5 is not visible on the map
			if (subgrid !== 5) {
				fullPlaceName += ":" + subgrid
			}
		}

		// Add range information for a single target location
		// TODO: Add direction information for a nearby place!
		if (isSingleTarget) {

			const startPosition = this.airfields[this.player.flight.airfield].position
			const startVector = Vector.create([startPosition[0], startPosition[2]])
			const distance = place.vector.distanceFrom(startVector) / 1000
			const distanceStr = numeral(Math.round(distance / 10) * 10).format("0,0")

			fullPlaceName += ", " + distanceStr + " kilometers away"
		}

		placeNames.push(fullPlaceName)
	})

	briefing.push(placeNames.join(" and "))

	return briefing.join(" ")
}
