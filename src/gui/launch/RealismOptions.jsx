import React from 'react'
import {reaction} from 'mobx'
import {observer} from 'mobx-react'
import classNames from 'classnames'
import {RealismOption} from '.'
import launchStore from './store'
import {readRealismOptions} from './actions'

const titleByRealismOption = {
	[RealismOption.ObjectMarkers]: 'Object markers',
	[RealismOption.AimingAssist]: 'Aiming assist',
	[RealismOption.BombingAssist]: 'Bombing assist',
	[RealismOption.Padlock]: 'Padlock',
	[RealismOption.NavigationMarkers]: 'Navigation markers',
	[RealismOption.InstrumentPanel]: 'Instrument panel',
	[RealismOption.AlternatePlaneVisibility]: 'Alternate plane visibility',
	[RealismOption.AllowSpectators]: 'Allow spectators',
	[RealismOption.SimplifiedPhysics]: 'Simplified physics',
	[RealismOption.NoWind]: 'No wind',
	[RealismOption.NoMisfires]: 'No misfires',
	[RealismOption.Unbreakable]: 'Unbreakable',
	[RealismOption.Invulnerability]: 'Invulnerability',
	[RealismOption.SimplifiedPhysiology]: 'Simplified physiology',
	[RealismOption.UnlimitedFuel]: 'Unlimited fuel',
	[RealismOption.UnlimitedAmmo]: 'Unlimited ammo',
	[RealismOption.NoEngineStall]: 'No engine stall',
	[RealismOption.WarmedUpEngine]: 'Warmed up engine',
	[RealismOption.SimplifiedControls]: 'Simplified controls',
	[RealismOption.RudderAssist]: 'Rudder assist',
	[RealismOption.CruiseControl]: 'Cruise control',
	[RealismOption.Autopilot]: 'Autopilot',
	[RealismOption.ThrottleAutoLimit]: 'Throttle auto limit',
	[RealismOption.EngineAutoControl]: 'Engine auto control',
	[RealismOption.RadiatorAssist]: 'Radiator assist'
}

const hintByRealismOption = {
	[RealismOption.ObjectMarkers]: 'Displays markers over various aircraft and ground objects for easier identification.',
	[RealismOption.AimingAssist]: 'Displays aiming assist mark for guns.',
	[RealismOption.BombingAssist]: 'Displays aiming assist mark for bombs and rockets.',
	[RealismOption.Padlock]: 'Enables the ability to visually “lock on” to an enemy aircraft and to follow its movements automatically.',
	[RealismOption.NavigationMarkers]: 'Shows navigation markers for waypoints and mission objectives.',
	[RealismOption.InstrumentPanel]: 'Displays a convenient instrument data panel in the low left corner of the screen along with the minimap.',
	[RealismOption.AlternatePlaneVisibility]: 'Enhanced aircraft visibility far away.',
	[RealismOption.AllowSpectators]: 'Allow spectating players (unchecking it also limits the pilot view in VR!).',
	[RealismOption.SimplifiedPhysics]: 'Reduces the intensity and complexity of the physical forces acting on your aircraft, thus making flying easier.',
	[RealismOption.NoWind]: 'Disables the effects of wind and turbulence.',
	[RealismOption.NoMisfires]: 'Eliminates the possibility of your machine guns or cannons misfiring.',
	[RealismOption.Unbreakable]: 'Eliminates the possibility of damage resulting from colliding with other objects or surfaces.',
	[RealismOption.Invulnerability]: "Eliminates the possibility of damage resulting from enemy fire, including the pilot.",
	[RealismOption.SimplifiedPhysiology]: 'Simplified physiology.',
	[RealismOption.UnlimitedFuel]: 'Enables an unlimited supply of fuel.',
	[RealismOption.UnlimitedAmmo]: 'Enables an unlimited supply of ammunition.',
	[RealismOption.NoEngineStall]: 'Eliminates the disruption of fuel flow to the engine resulting from negative-g aerobatic maneuvers.',
	[RealismOption.WarmedUpEngine]: 'Automatically warms up your engine to the optimal temperature at the start of the mission.',
	[RealismOption.SimplifiedControls]: 'Enables an automatic pilot-assistance system, thus making flying much easier.',
	[RealismOption.RudderAssist]: 'Enables automatic support for the yaw axis. This option is recommended if your controller does not have a sufficient number of axes to support yaw movement.',
	[RealismOption.CruiseControl]: 'Enables automatic control of the throttle in order to achieve the optimum flight speed. This option also takes into account the aircraft’s rate of climb or descent.',
	[RealismOption.Autopilot]: 'Enables artificial intelligence (AI) for the player’s pilot. This option allows the AI to fly the mission according to the defined objectives (including dogfighting with the enemy), without any input from the player.',
	[RealismOption.ThrottleAutoLimit]: 'Enables automatic limiting of engine speed, which will prevent the engine from breaking down. This option takes into account the angle and speed of your dives in order to prevent damage to the engine.',
	[RealismOption.EngineAutoControl]: 'Enables automatic control of your plane’s fuel mixture, propeller pitch (RPM), and supercharger settings in order to provide optimum power to your plane’s engine(s).',
	[RealismOption.RadiatorAssist]: 'Enables automatic control of your radiator in order to prevent engine failures resulting from overcooling or overheating. This option applies only to engines equipped with radiators and cowl shutters.'
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
	RealismOption.AlternatePlaneVisibility,
	RealismOption.AllowSpectators,
	RealismOption.Autopilot,
	RealismOption.ThrottleAutoLimit,
	RealismOption.EngineAutoControl,
	RealismOption.RadiatorAssist
])

// Realism options grouped by function
const realismOptionsByGroup = [
	[
		'Gameplay', [
			RealismOption.ObjectMarkers,
			RealismOption.AimingAssist,
			RealismOption.BombingAssist,
			RealismOption.Padlock,
			RealismOption.NavigationMarkers,
			RealismOption.InstrumentPanel,
			RealismOption.AlternatePlaneVisibility,
			RealismOption.AllowSpectators
		]
	],
	[
		'Simplifications', [
			RealismOption.SimplifiedPhysics,
			RealismOption.NoWind,
			RealismOption.NoMisfires,
			RealismOption.Unbreakable,
			RealismOption.Invulnerability,
			RealismOption.SimplifiedPhysiology,
			RealismOption.UnlimitedFuel,
			RealismOption.UnlimitedAmmo,
			RealismOption.NoEngineStall,
			RealismOption.WarmedUpEngine
		]
	],
	[
		'Piloting assistance', [
			RealismOption.SimplifiedControls,
			RealismOption.RudderAssist,
			RealismOption.CruiseControl,
			RealismOption.Autopilot,
			RealismOption.ThrottleAutoLimit,
			RealismOption.EngineAutoControl,
			RealismOption.RadiatorAssist
		]
	]
]

// Custom realism options component
@observer export default class RealismOptions extends React.Component {

	UNSAFE_componentWillMount() {

		// Read/reset realism options
		this.disposeReaction = reaction(
			() => launchStore.gamePath,
			() => {

				if (!launchStore.realismOptions) {
					launchStore.setRealismOptions(readRealismOptions())
				}
			},
			{
				fireImmediately: true
			}
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

								const className = classNames('checkbox', {
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
