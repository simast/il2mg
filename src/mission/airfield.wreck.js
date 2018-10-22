import {Item} from '../items'
import {data} from '../data'

// Make airfield wreck item
export default function makeAirfieldWreck(airfield, item) {

	let wreckItems = this.wreckItems

	// Make a list of plane/vehicle wreck items (blocks)
	if (!wreckItems) {

		wreckItems = this.wreckItems = {
			planes: [],
			vehicles: []
		}

		// Collect plane static blocks
		for (const planeID in this.planes) {

			const planeData = this.planes[planeID]

			// Ignore plane groups and planes without static blocks
			if (Array.isArray(planeData) || !planeData.static) {
				continue
			}

			for (const staticPlaneID of planeData.static) {

				const staticPlane = data.getItemType(staticPlaneID)

				if (!staticPlane.wreck ||
						wreckItems.planes.indexOf(staticPlane) >= 0) {

					continue
				}

				wreckItems.planes.push(staticPlane)
			}
		}

		// Collect vehicle static blocks
		for (const countryID in this.staticVehicles) {

			const staticVehiclesByCountry = this.staticVehicles[countryID]

			for (const vehicleType in staticVehiclesByCountry) {

				const staticVehiclesByType = staticVehiclesByCountry[vehicleType]

				for (const vehicle of staticVehiclesByType) {

					const staticVehicle = data.getItemType(vehicle.static)

					if (!staticVehicle.wreck ||
							wreckItems.vehicles.indexOf(staticVehicle) >= 0) {

						continue
					}

					wreckItems.vehicles.push(staticVehicle)
				}
			}
		}
	}

	// TODO: Limit number of wrecks per airfield

	const rand = this.rand
	let wreckType

	// 25% chance to use vehicle for wreck
	if (rand.bool(0.25)) {
		wreckType = rand.pick(wreckItems.vehicles)
	}
	// 75% chance to use plane for wreck
	else {
		wreckType = rand.pick(wreckItems.planes)
	}

	if (!wreckType) {
		return
	}

	const wreckItem = this.createItem(wreckType, false)

	const positionX = item[1]
	const positionY = item[2]
	const positionZ = item[3]
	let orientation = item[4]
	const orientationOffset = 15

	// Slightly vary/randomize wreck item orientation
	orientation = orientation + rand.real(-orientationOffset, orientationOffset)
	orientation = Math.max((orientation + 360) % 360, 0)

	wreckItem.setPosition(positionX, positionY, positionZ)
	wreckItem.setOrientation(orientation)

	// Set plane/vehicle damaged state (for destroyed effect)
	const damageItem = new Item('Damaged')

	wreckType.damage.forEach(damageIndex => {
		damageItem[damageIndex] = 1
	})

	wreckItem.addItem(damageItem)

	return [wreckItem]
}
