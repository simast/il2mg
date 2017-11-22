import {ItemTag, ItemFlag} from "../data"

// Make airfield limits
export default function makeAirfieldLimits(airfield) {

	const limits = Object.create(null)
	const value = airfield.value || 0
	const rand = this.rand
	const time = this.time
	const round = Math.round
	const min = Math.min
	const max = Math.max
	const isDark = (time.evening || time.night || time.dawn)

	// Special items
	limits[ItemTag.CargoTruck] = 0
	limits[ItemTag.FuelTruck] = 0
	limits[ItemTag.Car] = 0
	limits[ItemTag.AntiAircraftMG] = 0
	limits[ItemTag.AntiAircraftFlak] = 0
	limits[ItemTag.AntiAircraftTrain] = 0
	limits[ItemTag.SearchLight] = 0

	// Effects
	limits.effects = Object.create(null)
	limits.effects[ItemFlag.EffectSmoke] = 0
	limits.effects[ItemFlag.EffectCampFire] = 0

	// Vehicle routes
	limits.routes = 0

	if (value > 0) {

		// TODO: Modify TRUCK_CARGO and TRUCK_FUEL limits based on mission complexity param
		limits[ItemTag.CargoTruck] = round(min(max(value / 10, 4), 24))
		limits[ItemTag.FuelTruck] = round(min(max(value / 20, 2), 12))

		// Anti-aircraft vehicle limits
		limits[ItemTag.AntiAircraftMG] = round(min(max(value / (time.night ? 37.5 : 25), 2), 7))
		limits[ItemTag.AntiAircraftFlak] = round(min(max(value / (time.night ? 45 : 30), 0), 5))
		limits[ItemTag.AntiAircraftTrain] = round(0.25 + rand.real(0, 0.75))

		// Only add search lights for dark time periods
		if (isDark) {
			limits[ItemTag.SearchLight] = round(min(max(value / 40, 0), 4))
		}

		// Max 3 staff cars per airfield
		limits[ItemTag.Car] = round(min(max(value / 20, 1), 3))

		// Smoke and campfire effect limits
		limits.effects[ItemFlag.EffectSmoke] = round(min(max(value / 30, 1), 4))
		limits.effects[ItemFlag.EffectCampFire] = round(min(max(value / 50, 1), 2))

		// 50% chance for a single vehicle route during dark time periods
		if (isDark) {
			limits.routes = rand.integer(0, 1)
		}
		// Normal vehicle route limits during light time periods
		else {
			limits.routes = min(max(round(value / 28), 1), 5)
		}
	}

	// TODO: Add BLOCK_DECO item limits (based on mission complexity param)

	airfield.limits = limits
}