import React from "react"
import {reaction} from "mobx"
import {observer} from "mobx-react"
import classNames from "classnames"
import {RealismOption} from "."
import launchStore from "./store"
import {readRealismOptions} from "./actions"

const titleByRealismOption = {
	[RealismOption.ObjectMarkers]: "Object markers",
	[RealismOption.AimingAssist]: "Aiming assist",
	[RealismOption.BombingAssist]: "Bombing assist",
	[RealismOption.Padlock]: "Padlock",
	[RealismOption.NavigationMarkers]: "Navigation markers",
	[RealismOption.InstrumentPanel]: "Instrument panel",
	[RealismOption.AllowSpectators]: "Allow spectators",
	[RealismOption.SimplifiedPhysics]: "Simplified physics",
	[RealismOption.NoWind]: "No wind",
	[RealismOption.NoMisfires]: "No misfires",
	[RealismOption.Unbreakable]: "Unbreakable",
	[RealismOption.Invulnerability]: "Invulnerability",
	[RealismOption.UnlimitedFuel]: "Unlimited fuel",
	[RealismOption.UnlimitedAmmo]: "Unlimited ammo",
	[RealismOption.NoEngineStall]: "No engine stall",
	[RealismOption.WarmedUpEngine]: "Warmed up engine",
	[RealismOption.SimplifiedControls]: "Simplified controls",
	[RealismOption.RudderAssist]: "Rudder assist",
	[RealismOption.CruiseControl]: "Cruise control",
	[RealismOption.Autopilot]: "Autopilot",
	[RealismOption.ThrottleAutoLimit]: "Throttle auto limit",
	[RealismOption.EngineAutoControl]: "Engine auto control",
	[RealismOption.RadiatorAssist]: "Radiator assist"
}

const hintByRealismOption = {
	[RealismOption.ObjectMarkers]: "Displays markers over various objects for easier identification",
	[RealismOption.AimingAssist]: "Display aiming assist mark for guns",
	[RealismOption.BombingAssist]: "Display aiming assist mark for bombs and rockets",
	[RealismOption.Padlock]: "Lets you fix your view on enemy",
	[RealismOption.NavigationMarkers]: "Shows navigation markers for waypoints",
	[RealismOption.InstrumentPanel]: "Displays a convenient instrument data panel in the low left corner of the screen",
	[RealismOption.AllowSpectators]: "Allow spectating players (unchecking it also limits pilot view in VR)",
	[RealismOption.SimplifiedPhysics]: "Plane physics modeling is simplified",
	[RealismOption.NoWind]: "Completely still air",
	[RealismOption.NoMisfires]: "Your guns are always in top-notch shape",
	[RealismOption.Unbreakable]: "You can smash into things harmlessly",
	[RealismOption.Invulnerability]: "Enemy weapons won't harm you",
	[RealismOption.UnlimitedFuel]: "Lets you stay in air indefinitely",
	[RealismOption.UnlimitedAmmo]: "Ammunition won't run out",
	[RealismOption.NoEngineStall]: "Your engine won't stall because of aggressive maneuvering",
	[RealismOption.WarmedUpEngine]: "Engine is always warmed up",
	[RealismOption.SimplifiedControls]: "Plane controls are simplified for easier maneuvering",
	[RealismOption.RudderAssist]: "Turns on rudder assistance",
	[RealismOption.CruiseControl]: "Enables automatic speed",
	[RealismOption.Autopilot]: "Lets you activate automatic pilot",
	[RealismOption.ThrottleAutoLimit]: "Automatically limits maximum throttle",
	[RealismOption.EngineAutoControl]: "Regulates optimal fuel mixture, propeller pitch (RPM), supercharger speed",
	[RealismOption.RadiatorAssist]: "Automates opening or closing the radiator"
}

// Realism options that are displayed with red outline and are always enabled
// in both Normal and Expert realism presets.
const hardRealismOptions = new Set([
	RealismOption.NavigationMarkers,
	RealismOption.WarmedUpEngine
])

// Realism options that are displayed with green outline and are enabled only
// in Normal realism preset.
const normalRealismOptions = new Set([
	RealismOption.ObjectMarkers,
	RealismOption.BombingAssist,
	RealismOption.Padlock,
	RealismOption.InstrumentPanel,
	RealismOption.AllowSpectators,
	RealismOption.Autopilot,
	RealismOption.ThrottleAutoLimit,
	RealismOption.EngineAutoControl,
	RealismOption.RadiatorAssist
])

// Realism options grouped by function
const realismOptionsByGroup = [
	["Gameplay", [
		RealismOption.ObjectMarkers,
		RealismOption.AimingAssist,
		RealismOption.BombingAssist,
		RealismOption.Padlock,
		RealismOption.NavigationMarkers,
		RealismOption.InstrumentPanel,
		RealismOption.AllowSpectators
	]],
	["Simplifications", [
		RealismOption.SimplifiedPhysics,
		RealismOption.NoWind,
		RealismOption.NoMisfires,
		RealismOption.Unbreakable,
		RealismOption.Invulnerability,
		RealismOption.UnlimitedFuel,
		RealismOption.UnlimitedAmmo,
		RealismOption.NoEngineStall,
		RealismOption.WarmedUpEngine
	]],
	["Piloting assistance", [
		RealismOption.SimplifiedControls,
		RealismOption.RudderAssist,
		RealismOption.CruiseControl,
		RealismOption.Autopilot,
		RealismOption.ThrottleAutoLimit,
		RealismOption.EngineAutoControl,
		RealismOption.RadiatorAssist
	]]
]

// Custom realism options component
@observer export default class RealismOptions extends React.Component {

	componentWillMount() {

		// Read/reset realism options
		this.disposeReaction = reaction(
			() => launchStore.gamePath,
			() => {

				if (!launchStore.realismOptions) {
					launchStore.setRealismOptions(readRealismOptions())
				}
			},
			true // Run immediately
		)
	}

	componentWillUnmount() {

		if (this.disposeReaction) {
			this.disposeReaction()
		}
	}

	// Render component
	render() {

		const {realismOptions} = launchStore

		if (!realismOptions) {
			return null
		}

		return (
			<div id="realismOptions">
				{realismOptionsByGroup.map(([groupTitle, groupOptions]) => (
					<div key={groupTitle}>
						<div>{groupTitle}</div>
						<div className="group">
							{groupOptions.map(option => {

								const className = classNames("checkbox", {
									normal: normalRealismOptions.has(option),
									hard: hardRealismOptions.has(option)
								})

								return (
									<label className={className} key={option} title={hintByRealismOption[option]}>
										<input
											type="checkbox"
											checked={realismOptions.includes(option)}
											onChange={() => launchStore.toggleRealismOption(option)}
										/>
										{titleByRealismOption[option]}
									</label>
								)
							})}
						</div>
					</div>
				))}
			</div>
		)
	}
}