import {data} from '../data'
import {ItemFlag} from '../data/enums'

// Make airfield static item
export default function makeAirfieldStatic(airfield, item) {

	const staticItem = this.createItem(data.getItemType(item[0]), false)

	staticItem.setPosition(item[1], item[2], item[3])
	staticItem.setOrientation(item[4])

	// Set static item country (required for spawning infantry)
	if (airfield.country && item[5] !== ItemFlag.BlockDecoration) {

		const time = this.time
		let countryChance = 0.8 // 80%

		// Less infantry for dark time periods
		if (time.night) {
			countryChance = 0.25 // 25%
		}
		else if (time.sunset || time.dusk || time.dawn) {
			countryChance = 0.5 // 50%
		}

		if (this.rand.bool(countryChance)) {
			staticItem.setCountry(this.rand.pick(airfield.countriesWeighted))
		}
	}

	return [staticItem]
}
