import {Airfield} from '../items'
import {PRECISION_POSITION} from '../items/constants'
import {data} from '../data'
import {ItemFlag, CallsignGroup} from '../data/enums'

// Make airfield taxi route
export default function makeAirfieldTaxi(airfield, taxiRouteID) {

	// TODO: Invert taxi points based on takeoff against the wind requirements

	taxiRouteID = parseInt(taxiRouteID, 10)

	if (!airfield.taxi || !airfield.taxi[taxiRouteID]) {
		return false
	}

	const taxiRoute = airfield.taxi[taxiRouteID]
	const runwayID = taxiRoute[1]
	let activeTaxiRoutes = airfield.activeTaxiRoutes

	if (!activeTaxiRoutes) {
		activeTaxiRoutes = airfield.activeTaxiRoutes = Object.create(null)
	}

	// Limit 1 taxi route per runway (due to AI issues)
	if (activeTaxiRoutes[runwayID] !== undefined) {
		return (activeTaxiRoutes[runwayID] === taxiRouteID)
	}

	const isInvertible = (taxiRoute[2] === ItemFlag.TaxiInvertible)
	const basePoint = taxiRoute[3]

	// Set unique airfield callsign
	if (!airfield.callsign) {

		airfield.callsign = this.getCallsign(CallsignGroup.Airfield)

		// Make sure the callsign used for player home airfield is unique
		if (this.player && this.player.flight) {

			const playerAirfield = this.airfields[this.player.flight.airfield]

			if (airfield.id !== playerAirfield.id && playerAirfield.callsign) {

				while (airfield.callsign.id === playerAirfield.callsign.id) {
					airfield.callsign = this.getCallsign(CallsignGroup.Airfield)
				}
			}
		}

		// Use the same airfield callsign for beacon spotter
		if (airfield.beacon) {
			airfield.beacon.Callsign = airfield.callsign.id
		}
	}

	// Create airfield item
	const airfieldItem = this.createItem(data.getItemType(taxiRoute[0]), airfield.group)

	airfieldItem.setPosition(basePoint[0], airfield.position[1], basePoint[1])
	airfieldItem.setOrientation(basePoint[2])
	airfieldItem.setCountry(airfield.country)
	airfieldItem.Callsign = airfield.callsign.id

	const taxiPoints = taxiRoute[4]

	// Invert taxi points based on shortest distance to runway
	if (isInvertible) {

		let isForward = true
		let distanceForward = 0
		let distanceBackward = 0
		let lastPoint = taxiPoints[0]

		// Compute forward and backward distances
		for (let i = 1; i < taxiPoints.length; i++) {

			const point = taxiPoints[i]

			const distance = Math.sqrt(
				Math.pow(lastPoint[0] - point[0], 2) + Math.pow(lastPoint[1] - point[1], 2)
			)

			if (isForward) {
				distanceForward += distance
			}
			else {
				distanceBackward += distance
			}

			// Switch to backward distance on runway point type
			if (point[2] === ItemFlag.TaxiRunway) {

				isForward = false
				i++ // Skip next runway point
			}

			lastPoint = taxiPoints[i]
		}

		// Reverse taxi point list
		if (distanceForward > distanceBackward) {
			taxiPoints.reverse()
		}
	}

	const chartItem = new Airfield.Chart()
	const firstPoint = taxiPoints[0]
	const lastPoint = taxiPoints[taxiPoints.length - 1]

	// Create airfield taxi route Chart->Point list
	for (let i = 0; i < taxiPoints.length; i++) {

		const point = taxiPoints[i]
		let pointType = 1 // Taxi point type

		// Parking point type
		if (point === firstPoint || point === lastPoint) {
			pointType = 0
		}
		// Runway point type
		else if (point[2] === ItemFlag.TaxiRunway) {

			pointType = 2

			// Index takeoff point start position
			if (!taxiRoute.takeoffStart) {
				taxiRoute.takeoffStart = [point[0], airfield.position[1], point[1]]
			}
			// Index takeoff point end position
			else if (!taxiRoute.takeoffEnd) {
				taxiRoute.takeoffEnd = [point[0], airfield.position[1], point[1]]
			}
		}

		// Convert absolute taxi point coordinates to relative vector X/Y offsets
		const pointXDiff = point[0] - basePoint[0]
		const pointYDiff = point[1] - basePoint[1]
		const pointTheta = -basePoint[2] * (Math.PI / 180)
		const pointX = (pointXDiff * Math.cos(pointTheta)) - (pointYDiff * Math.sin(pointTheta))
		const pointY = (pointXDiff * Math.sin(pointTheta)) + (pointYDiff * Math.cos(pointTheta))

		chartItem.addItem(new Airfield.Chart.Point(
			pointType,
			Number(pointX.toFixed(PRECISION_POSITION)),
			Number(pointY.toFixed(PRECISION_POSITION))
		))
	}

	airfieldItem.addItem(chartItem)
	airfieldItem.createEntity()

	// Set active taxi route for runway
	activeTaxiRoutes[runwayID] = taxiRouteID

	return true
}
