/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");
var itemTags = require("./").itemTags;
var itemFlags = require("./").itemFlags;

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
	var effects = this.data.effects;
	var effectScript;
	var startOnLoad = true;
	var isRaining = (this.weather.precipitation.type === 1);
	var isDark = (time.evening || time.night || time.dawn);
	var items = [];

	// House smoke
	if (effectType === itemFlags.EFFECT_SMOKE) {

		// 50% chance for smoke when raining
		if (!isRaining || (isRaining && rand.bool(0.5))) {
			effectScript = effects.house_smoke.script;
		}
	}
	// Campfire
	else if (effectType === itemFlags.EFFECT_CAMP) {

		effectScript = effects.landfire.script;

		// When raining/dark or 75% chance - the campfire has no fire (but smoke)
		if (isRaining || isDark || rand.bool(0.75)) {

			startOnLoad = false;

			var campfireSmoke = makeAirfieldEffect.call(this, airfield, [
				itemTags.EFFECT,
				item[1],
				item[2],
				item[3],
				itemFlags.EFFECT_SMOKE
			]);

			if (campfireSmoke && campfireSmoke.length) {
				items.push(campfireSmoke[0]);
			}
		}
	}
	// Siren
	else if (effectType === itemFlags.EFFECT_SIREN) {

		effectScript = effects.siren.script;
		startOnLoad = false;
	}

	// TODO: Add support for EFFECT:LAND
	// TODO: Add support for EFFECT:SIREN

	if (!effectScript) {
		return;
	}

	var effect = this.createItem("Effect", false);

	effect.setPosition(item[1], item[2], item[3]);
	effect.setOrientation(rand.real(0, 360));
	effect.Script = effectScript;

	effect.createEntity();

	// Start effect on airfield load event
	if (startOnLoad) {

		// Create a shared effect start command (when airfield is loaded)
		if (!airfield.onLoadEffect) {

			airfield.onLoadEffect = this.createItem("MCU_CMD_Effect", false);
			airfield.onLoadEffect.setPositionNear(airfield.onLoad);
			airfield.onLoadEffect.ActionType = Item.MCU_CMD_Effect.ACTION.START;

			airfield.onLoad.addTarget(airfield.onLoadEffect);

			// TODO: Create onUnloadEffect command

			items.push(airfield.onLoadEffect);
		}

		airfield.onLoadEffect.addObject(effect);
	}

	items.push(effect);

	// Update airfield limits
	if (airfield.limits.effects[effectType]) {
		airfield.limits.effects[effectType]--;
	}

	return items;
};