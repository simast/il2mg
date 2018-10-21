import {EffectAction} from '../items/enums'
import data, {ItemTag, ItemFlag} from '../data'
import {Precipitation} from './weather'

// Make airfield effect item
export default function makeAirfieldEffect(airfield, item) {

	if (!airfield.country) {
		return
	}

	const effect = item[4]

	// Enforce airfield limits
	if (airfield.limits.effects[effect] <= 0) {
		return
	}

	const rand = this.rand
	const time = this.time
	const zone = airfield.zone
	const isRaining = (this.weather.precipitation.type === Precipitation.Rain)
	const isDark = (time.evening || time.night || time.dawn)
	const items = []

	let effectType
	let startOnLoad = true

	// House smoke
	if (effect === ItemFlag.EffectSmoke) {

		// 50% chance for smoke when raining
		if (!isRaining || (isRaining && rand.bool(0.5))) {
			effectType = 'house_smoke'
		}
	}
	// Campfire
	else if (effect === ItemFlag.EffectCampFire) {

		effectType = 'landfire'

		// When raining/dark or 75% chance - the campfire has no fire (but smoke)
		if (isRaining || isDark || rand.bool(0.75)) {

			startOnLoad = false

			const campfireSmoke = makeAirfieldEffect.call(this, airfield, [
				ItemTag.Effect,
				item[1],
				item[2],
				item[3],
				ItemFlag.EffectSmoke
			])

			if (campfireSmoke && campfireSmoke.length) {
				items.push(campfireSmoke[0])
			}
		}
		// Burning campfire
		else {

			const campfirePosY = item[2]

			// Make the campfire effect look more like a small fire rather than a huge
			// landing fire by slightly lowering the effect item to the ground.
			item[2] = campfirePosY - 0.18 // -18 cm

			// Create a small burned/melted ground effect (crater) underneath the campfire
			const campfireGround = this.createItem(data.getItemType('crater_16'), false)

			campfireGround.setPosition(item[1], campfirePosY - 0.28, item[3])
			campfireGround.setOrientation(rand.real(0, 360))

			items.push(campfireGround)
		}
	}
	// Siren
	else if (effect === ItemFlag.EffectSiren) {

		effectType = 'siren'
		startOnLoad = false
	}

	// TODO: Add support for EFFECT:LAND
	// TODO: Add support for EFFECT:SIREN

	if (!effectType) {
		return
	}

	const effectItem = this.createItem(data.getItemType(effectType), false)

	effectItem.setPosition(item[1], item[2], item[3])
	effectItem.setOrientation(rand.real(0, 360))
	effectItem.createEntity(true)

	// Attach effect to airfield "bubble" zone
	zone.onActivate.addObject(effectItem)
	zone.onDeactivate.addObject(effectItem)

	// Start effect on airfield load event
	if (startOnLoad) {

		let onEffectStart = zone.onEffectStart

		// Create a shared effect start command (activated when airfield is loaded)
		if (!onEffectStart) {

			onEffectStart = zone.onEffectStart = zone.group.createItem('MCU_CMD_Effect')

			onEffectStart.setPositionNear(zone.onLoad)
			onEffectStart.ActionType = EffectAction.Start

			zone.onLoad.addTarget(onEffectStart)

			// TODO: Create onEffectStop event item?
		}

		// Start effect on airfield zone load event
		onEffectStart.addObject(effectItem)
	}

	items.push(effectItem)

	// Update airfield limits
	if (airfield.limits.effects[effect]) {
		airfield.limits.effects[effect]--
	}

	return items
}
