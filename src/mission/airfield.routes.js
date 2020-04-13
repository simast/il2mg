import {ItemTag, ItemFlag} from '../data/enums'
import {Priority, FormationType} from '../items/enums'
import makeAirfieldVehicle from './airfield.vehicle'

// Make airfield vehicle routes
export default function makeAirfieldRoutes(airfield, routes) {

	if (!airfield.value || !airfield.country || !routes || !routes.length) {
		return
	}

	const rand = this.rand

	rand.shuffle(routes)

	while (--airfield.limits.routes >= 0 && routes.length) {

		// Weighted vehicle pool (chance) array
		const vehiclePool = rand.shuffle([
			ItemTag.CargoTruck,
			ItemTag.CargoTruck,
			ItemTag.CargoTruck,
			ItemTag.Car
		])

		let vehicle = null

		// Create a live vehicle item object for this route
		while (vehiclePool.length && !vehicle) {

			vehicle = makeAirfieldVehicle.call(this, airfield, [
				vehiclePool.shift(),
				...airfield.position,
				0 // Orientation
			], true)

			if (Array.isArray(vehicle)) {
				vehicle = vehicle[0]
			}
		}

		// Most likely a result of airfield vehicle limits
		if (!vehicle) {
			continue
		}

		const route = routes.shift()
		const routeGroup = this.createItem('Group', airfield.group)
		let waypointVehicle = rand.integer(0, route.length - 1)
		let waypointFirst = null
		let waypointLast = null
		let isRoadFormation = false // Default is offroad formation

		routeGroup.addItem(vehicle)

		// 50% chance to reverse/invert the route
		if (rand.bool()) {
			route.reverse()
		}

		// Create route waypoints
		for (let w = 0; w < route.length; w++) {

			const item = route[w]
			const itemNext = route[w + 1] || route[0]
			const itemPrev = route[w - 1] || route[route.length - 1]
			const isStop = (item[2] === ItemFlag.RouteStop)
			const isRoad = (item[2] === ItemFlag.RouteRoad)
			const isRoadNext = (itemNext[2] === ItemFlag.RouteRoad)
			const isRoadPrev = (itemPrev[2] === ItemFlag.RouteRoad)

			// Create waypoint MCU item
			const waypoint = this.createItem('MCU_Waypoint', routeGroup)

			if (waypointLast) {
				waypointLast.addTarget(waypoint)
			}
			else {
				waypointFirst = waypoint
			}

			waypoint.addObject(vehicle)
			waypoint.setPosition(item[0], airfield.position[1], item[1])

			// Set waypoint orientation (to the direction of next waypoint)
			waypoint.setOrientationTo(itemNext[0], itemNext[1])

			// Compute waypoint speed
			const distance = Math.sqrt(Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2))

			// Waypoint distance where speed is maximum
			const distanceMax = 180

			// Offroad speed limits
			let speedMin = 25
			let speedMax = 45

			// Onroad speed limits
			if (isRoad && isRoadPrev) {
				speedMin = 40
				speedMax = 65
			}

			let speed = (distance / distanceMax) * speedMax

			speed = Math.max(speed, speedMin)
			speed = Math.min(speed, speedMax)

			// A bit of randomness
			speed += rand.real(-3, 3)

			waypoint.Speed = Math.round(speed)

			// Compute waypoint area
			const b = Math.pow(item[0] - itemPrev[0], 2) + Math.pow(item[1] - itemPrev[1], 2)
			const a = Math.pow(item[0] - itemNext[0], 2) + Math.pow(item[1] - itemNext[1], 2)
			const c = Math.pow(itemNext[0] - itemPrev[0], 2) + Math.pow(itemNext[1] - itemPrev[1], 2)

			const angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b))
			const angleDiff = Math.abs((angle * (180 / Math.PI)) - 180)
			let area = angleDiff / 180 * 40

			// Waypoint area radius limits (from 10 to 20 meters)
			area = Math.min(Math.max(area, 10), 20)

			waypoint.Area = Math.round(area)
			waypoint.Priority = Priority.Low

			waypointLast = waypoint

			// Create a random stop waypoint timer
			if (isStop) {

				const stopTimer = this.createItem('MCU_Timer', routeGroup)

				stopTimer.Time = Number(rand.real(20, 60).toFixed(3))
				stopTimer.setPositionNear(waypoint)

				waypoint.addTarget(stopTimer)

				waypointLast = stopTimer
			}

			let formation = null

			// Road vehicle formation
			if (isRoad && !isRoadFormation) {

				formation = FormationType.VehicleColumnRoad
				isRoadFormation = true
			}
			// Offroad vehicle formation
			else if ((!isRoad && isRoadFormation) || (isRoad && !isRoadNext)) {

				formation = FormationType.VehicleColumn
				isRoadFormation = false
			}

			// Create formation command item
			if (formation !== null) {

				const formationCommand = this.createItem('MCU_CMD_Formation', routeGroup)

				formationCommand.FormationType = formation
				formationCommand.addObject(vehicle)
				formationCommand.setPositionNear(waypoint)

				waypoint.addTarget(formationCommand)
			}

			// 25% chance to use each stop waypoint as vehicle starting point
			if (isStop && rand.bool(0.25)) {
				waypointVehicle = waypoint
			}

			// Set random/assigned vehicle waypoint
			if (waypointVehicle === w) {
				waypointVehicle = waypoint
			}
		}

		// Link last waypoint to the first (creating a loop)
		waypointLast.addTarget(waypointFirst)

		// Set vehicle position/orientation to starting waypoint
		vehicle.setPosition(waypointVehicle.XPos, waypointVehicle.YPos, waypointVehicle.ZPos)
		vehicle.setOrientation((vehicle.YOri + waypointVehicle.YOri) % 360)

		airfield.zone.onInitialize.addTarget(waypointVehicle)
	}
}