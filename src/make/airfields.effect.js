/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");
var itemTag = DATA.itemTag;
var itemFlag = DATA.itemFlag;
var effects = DATA.effects;
var grounds = DATA.grounds;

// Make airfield effect item
module.exports = function makeAirfieldEffect(airfield, item) {

	if (!airfield.country) {
		return;
	}

	var effectType = item[4];

	// Enforce airfield limits
	if (airfield.limits.effects[effectType] <= 0) {
		return;
	}

	var rand = this.rand;
	var time = this.time;
	var effectScript;
	var startOnLoad = true;
	var isRaining = (this.weather.precipitation.type === 1);
	var isDark = (time.evening || time.night || time.dawn);
	var items = [];

	// House smoke
	if (effectType === itemFlag.EFFECT_SMOKE) {

		// 50% chance for smoke when raining
		if (!isRaining || (isRaining && rand.bool(0.5))) {
			effectScript = effects.house_smoke.script;
		}
	}
	// Campfire
	else if (effectType === itemFlag.EFFECT_CAMP) {

		effectScript = effects.landfire.script;

		// When raining/dark or 75% chance - the campfire has no fire (but smoke)
		if (isRaining || isDark || rand.bool(0.75)) {

			startOnLoad = false;

			var campfireSmoke = makeAirfieldEffect.call(this, airfield, [
				itemTag.EFFECT,
				item[1],
				item[2],
				item[3],
				itemFlag.EFFECT_SMOKE
			]);

			if (campfireSmoke && campfireSmoke.length) {
				items.push(campfireSmoke[0]);
			}
		}
		// Burning campfire
		else {

			var campfirePosY = item[2];

			// Make the campfire effect look more like a small fire rather than a huge
			// landing fire by slightly lowering the effect item to the ground.
			item[2] = campfirePosY - 0.18; // -18 cm

			// Create a small burned/melted ground effect (crater) underneath the campfire
			var campfireGround = this.createItem("Ground", false);

			campfireGround.Model = grounds.crater_16.model;
			campfireGround.setPosition(item[1], campfirePosY - 0.28, item[3]);
			campfireGround.setOrientation(rand.real(0, 360));

			items.push(campfireGround);
		}
	}
	// Siren
	else if (effectType === itemFlag.EFFECT_SIREN) {

		effectScript = effects.siren.script;
		startOnLoad = false;
	}

	// TODO: Add support for EFFECT:LAND
	// TODO: Add support for EFFECT:SIREN

	if (!effectScript) {
		return;
	}

	var effectItem = this.createItem("Effect", false);

	effectItem.setPosition(item[1], item[2], item[3]);
	effectItem.setOrientation(rand.real(0, 360));
	effectItem.Script = effectScript;

	effectItem.createEntity();

	// Start effect on airfield load event
	if (startOnLoad) {

		// Create a shared effect start command (when airfield is loaded)
		if (!airfield.onLoadEffect) {

			airfield.onLoadEffect = this.createItem("MCU_CMD_Effect", false);
			airfield.onLoadEffect.setPositionNear(airfield.onLoad);
			airfield.onLoadEffect.ActionType = Item.MCU_CMD_Effect.ACTION_START;

			airfield.onLoad.addTarget(airfield.onLoadEffect);

			// TODO: Create onUnloadEffect command

			items.push(airfield.onLoadEffect);
		}

		airfield.onLoadEffect.addObject(effectItem);
	}

	items.push(effectItem);

	// Update airfield limits
	if (airfield.limits.effects[effectType]) {
		airfield.limits.effects[effectType]--;
	}

	return items;
};