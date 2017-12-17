import addLazyProperty from "lazy-property"
import {makeActivityState} from "./flight.state"
import makeFlightTime from "./flight.time"
import makeFlightPose from "./flight.pose"
import makeFlightActions from "./flight.actions"

// Virtual activity zone size as inner, base and outer circle radius (km)
// NOTE: Virtual point activity zones will use either one or two check zones.
// Two check zones are used to make sure virtual flights do not activate while
// on top of another flight position. They will only activate when other
// flights are farther than the inner zone and inside the outer zone.
// NOTE: Current max in-game draw distance for aircraft is 10 km!
const ZONE_RADIUS_INNER = 9500
const ZONE_RADIUS_BASE = 10000
const ZONE_RADIUS_OUTER = 10500

// Required distance from player or other enemy planes when virtual flights
// trigger their unload and deactivation logic.
const UNLOAD_PROXIMITY_DISTANCE = 11000

// Make virtual flight
export default function makeFlightVirtual(flight) {

	if (!flight.virtual || flight.time <= 0) {
		return
	}

	const {plan} = flight
	let waitTime = 0

	// Initialize virtual point zone storage
	const virtualZones = []

	// Process plan activities
	for (const activity of plan) {

		const activityTime = activity.time

		// Skip non-state activities
		if (activityTime === undefined) {
			continue
		}

		let virtualPoints = 0

		if (activity.makeVirtualPoints) {
			virtualPoints = activity.makeVirtualPoints()
		}

		// Skip activities without virtual points
		if (!virtualPoints) {

			waitTime += activityTime
			makeActivityState.call(this, activity, activityTime)

			continue
		}

		const stepTime = activityTime / (virtualPoints + 1)
		let isActivityRemoved = false

		// Create virtual points
		for (let i = 1; i <= virtualPoints; i++) {

			const oldTime = flight.time

			// Fast-forward virtual flight activity state
			makeActivityState.call(this, activity, stepTime)

			// Make virtual flight time
			makeFlightTime.call(this, flight)

			const elapsedTime = waitTime + (oldTime - flight.time)

			// Reset accumulated wait time
			if (waitTime) {
				waitTime = 0
			}

			// Make virtual flight activity zone
			makeVirtualFlightZone.call(this, flight, virtualZones, elapsedTime)

			// Make virtual flight plane items
			makeVirtualFlightPlanes.call(this, flight)

			// Make virtual flight air start pose
			makeFlightPose.call(this, flight)

			// Make virtual flight plan actions
			makeFlightActions.call(this, flight)

			// NOTE: Activities may remove themselves from the plan while
			// fast-forwarding their state!
			isActivityRemoved = (plan.indexOf(activity) === -1)

			if (isActivityRemoved) {
				break
			}
		}

		const remainingTime = activity.time

		// Finish activity by advancing the remaining time
		if (remainingTime) {

			waitTime += remainingTime

			if (!isActivityRemoved) {
				makeActivityState.call(this, activity, remainingTime)
			}
		}
	}

	// Make final virtual flight activity zone
	makeVirtualFlightZone.call(this, flight, virtualZones, waitTime)
}

// Make virtual flight plane items
function makeVirtualFlightPlanes(flight) {

	// Clone each flight plane item
	for (const element of flight.elements) {
		for (const plane of element) {

			const leaderPlane = element[0]
			const isElementLeader = (leaderPlane === plane)
			const oldItem = plane.item
			const newItem = this.createItem(oldItem.type, oldItem.parent)

			// Copy over old properties/data
			for (const prop in oldItem) {

				// Keep unique item index
				if (prop === "Index") {
					continue
				}

				newItem[prop] = oldItem[prop]
			}

			// Create a new entity
			newItem.createEntity(true)
			this.totalEntities++

			// Group subordinate planes with element leader
			if (element.length > 1 && !isElementLeader) {
				newItem.entity.addTarget(leaderPlane.item.entity)
			}

			plane.item = newItem
		}
	}
}

// Make virtual flight activity zone
function makeVirtualFlightZone(flight, virtualZones, waitTime) {

	const zone = {}
	const isFirstPoint = !virtualZones.length
	const {task} = flight
	const flightGroup = flight.group
	const flightDelay = flight.plan.start.delay

	const onBegin = flight.onBegin
	const zoneGroup = flightGroup.createItem("Group")
	const checkZone = zoneGroup.createItem("MCU_CheckZone")
	const onActivate = zoneGroup.createItem("MCU_Activate")
	const onNextBegin = zoneGroup.createItem("MCU_Timer")
	const onDelete = zoneGroup.createItem("MCU_Delete")
	const beginDeactivate = zoneGroup.createItem("MCU_Deactivate")
	const onUnload = zoneGroup.createItem("MCU_Timer")
	const onProximityPlayer = zoneGroup.createItem("MCU_Proximity")
	const onProximityEnemy = zoneGroup.createItem("MCU_Proximity")
	const proximityCheck = zoneGroup.createItem("MCU_Timer")
	const proximityActivate = zoneGroup.createItem("MCU_Activate")
	const proximityDeactivate = zoneGroup.createItem("MCU_Deactivate")

	checkZone.Zone = ZONE_RADIUS_BASE
	checkZone.PlaneCoalitions = this.coalitions
	checkZone.setPositionNear(flight.leader.item)

	onActivate.setPositionNear(checkZone)

	// Activate each element leader
	for (const element of flight.elements) {
		onActivate.addObject(element[0].item)
	}

	let onCheck = checkZone
	let onCheckBegin = checkZone
	let onCheckActivate = checkZone

	// Use advanced activation trigger setup with an outer check zone to ensure
	// virtual flights that move around do not activate on top of other flights.
	if (flightDelay || (!isFirstPoint && !task.local)) {

		const checkZoneOuter = zoneGroup.createItem("MCU_CheckZone")
		const checkZoneOuterCheck = zoneGroup.createItem("MCU_Timer")
		const checkZoneOuterActivate = zoneGroup.createItem("MCU_Activate")
		const checkZoneOuterDeactivate = zoneGroup.createItem("MCU_Deactivate")
		const checkZoneActivate = zoneGroup.createItem("MCU_Activate")
		const checkZoneDeactivate = zoneGroup.createItem("MCU_Deactivate")
		const activateTimer = zoneGroup.createItem("MCU_Timer")
		const activateTimerDelay = zoneGroup.createItem("MCU_Timer")
		const activateTimerActivate = zoneGroup.createItem("MCU_Activate")
		const recheckTimer = zoneGroup.createItem("MCU_Timer")

		checkZone.Zone = ZONE_RADIUS_INNER
		checkZone.addTarget(checkZoneDeactivate)
		checkZone.addTarget(activateTimerDelay)
		checkZone.addTarget(recheckTimer)

		checkZoneOuter.Zone = ZONE_RADIUS_OUTER
		checkZoneOuter.PlaneCoalitions = this.coalitions
		checkZoneOuter.setPositionNear(checkZone)
		checkZoneOuter.addTarget(checkZoneOuterDeactivate)
		checkZoneOuter.addTarget(checkZone)
		checkZoneOuter.addTarget(checkZoneActivate)
		checkZoneOuter.addTarget(activateTimerDelay)
		checkZoneOuter.addTarget(activateTimerActivate)

		checkZoneOuterCheck.addTarget(checkZoneOuter)
		checkZoneOuterCheck.addTarget(checkZoneOuterActivate)
		checkZoneOuterCheck.setPositionNear(checkZoneOuter)

		checkZoneOuterActivate.addTarget(checkZoneOuter)
		checkZoneOuterActivate.setPositionNear(checkZoneOuter)

		checkZoneOuterDeactivate.addTarget(checkZoneOuter)
		checkZoneOuterDeactivate.setPositionNear(checkZoneOuter)

		checkZoneActivate.addTarget(checkZone)
		checkZoneActivate.setPositionNear(checkZone)

		checkZoneDeactivate.addTarget(checkZone)
		checkZoneDeactivate.addTarget(activateTimer)
		checkZoneDeactivate.setPositionNear(checkZone)

		activateTimerDelay.addTarget(activateTimer)
		activateTimerDelay.setPositionNear(checkZoneOuter)

		// Delay timer used to postpone activation for 2 seconds - inner check zone
		// will cancel this timer if there are planes present on the inner zone.
		activateTimerDelay.Time = 2

		activateTimerActivate.addTarget(activateTimer)
		activateTimerActivate.setPositionNear(checkZoneOuter)

		activateTimer.addTarget(checkZoneDeactivate)
		activateTimer.addTarget(onActivate)
		activateTimer.setPositionNear(activateTimerDelay)

		onActivate.setPositionNear(activateTimer)

		recheckTimer.addTarget(checkZoneOuterCheck)
		recheckTimer.setPositionNear(checkZone)

		// When planes are detected inside the restricted inner zone - this trigger
		// will reset and will re-check again in 5 seconds.
		recheckTimer.Time = 5

		onCheck = checkZoneOuter
		onCheckBegin = checkZoneOuterCheck
		onCheckActivate = activateTimer
	}
	else {
		checkZone.addTarget(onActivate)
	}

	proximityCheck.Time = 10
	proximityCheck.setPositionNear(onUnload)
	proximityCheck.addTarget(proximityActivate)

	onUnload.Time = proximityCheck.Time + 5
	onUnload.setPositionNear(checkZone)
	onUnload.addTarget(proximityDeactivate)
	onUnload.addTarget(onDelete)

	onProximityPlayer.Distance = UNLOAD_PROXIMITY_DISTANCE
	onProximityPlayer.setPositionNear(onUnload)
	onProximityPlayer.addObject(this.player.item)
	onProximityPlayer.addTarget(proximityDeactivate)
	onProximityPlayer.addTarget(proximityCheck)
	onProximityPlayer.addTarget(onUnload)

	onProximityEnemy.Distance = UNLOAD_PROXIMITY_DISTANCE
	onProximityEnemy.setPositionNear(onUnload)
	onProximityEnemy.addTarget(proximityDeactivate)
	onProximityEnemy.addTarget(proximityCheck)
	onProximityEnemy.addTarget(onUnload)

	// Enable all enemy plane coalitions
	onProximityEnemy.PlaneCoalitions = this.coalitions.filter(
		coalition => coalition !== flight.coalition
	)

	proximityActivate.setPositionNear(onUnload)
	proximityActivate.addTarget(onProximityPlayer)
	proximityActivate.addTarget(onProximityEnemy)

	proximityDeactivate.setPositionNear(onUnload)
	proximityDeactivate.addTarget(onProximityPlayer)
	proximityDeactivate.addTarget(onProximityEnemy)

	onNextBegin.Time = Number(waitTime.toFixed(3))
	onNextBegin.setPositionNear(onCheck)
	onNextBegin.addTarget(onDelete)
	onNextBegin.addTarget(beginDeactivate)

	onDelete.setPositionNear(onNextBegin)

	// Lazy getter/event used to delete all further zone plane items
	addLazyProperty(zone, "onDeleteNext", () => {

		const onDeleteNext = zoneGroup.createItem("MCU_Delete")

		onDeleteNext.setPositionNear(onCheckActivate)
		onCheckActivate.addTarget(onDeleteNext)

		return onDeleteNext
	})

	for (const element of flight.elements) {
		for (const plane of element) {

			// Delete virtual point plane entities
			onDelete.addObject(plane.item)

			// Delete virtual point plane entities when previous points are activated
			for (const prevZone of virtualZones) {
				prevZone.onDeleteNext.addObject(plane.item)
			}

			// Connect plane items to enemy proximity trigger
			onProximityEnemy.addObject(plane.item)
		}
	}

	// Connect leader plane item to player proximity trigger
	onProximityPlayer.addObject(flight.leader.item)

	beginDeactivate.setPositionNear(onNextBegin)
	beginDeactivate.addTarget(onNextBegin)
	beginDeactivate.addTarget(onCheck)
	beginDeactivate.addTarget(onCheckBegin)

	onCheckActivate.addTarget(beginDeactivate)
	onCheckActivate.addTarget(flight.onStart)
	onCheckActivate.addTarget(onUnload)
	onCheckActivate.addTarget(onProximityEnemy)
	onCheckActivate.addTarget(onProximityPlayer)

	onBegin.addTarget(onNextBegin)
	onBegin.addTarget(onCheckBegin)

	flight.onBegin = onNextBegin

	// NOTE: Next start activity action will create a new onStart event!
	delete flight.onStart

	// Save virtual point zone data
	virtualZones.push(zone)
}