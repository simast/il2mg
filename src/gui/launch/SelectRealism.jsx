import React from 'react'
import {observer} from 'mobx-react'
import classNames from 'classnames'
import {RealismPreset} from '.'
import launchStore from './store'
import RealismOptions from './RealismOptions'

// Realism settings/preset modes
const realismPresets = [
	[RealismPreset.Normal, 'Normal'],
	[RealismPreset.Expert, 'Expert'],
	[RealismPreset.Custom, 'Custom']
]

// Select realism component
@observer export default class SelectRealism extends React.Component {

	// Render component
	render() {

		return (
			<div id="selectRealism">
				<div>Realism</div>
				<ul id="realismPreset">
					{realismPresets.map(([presetID, presetLabel]) => {

						const className = classNames('realismPreset' + presetID, {
							selected: presetID === launchStore.realismPreset
						})

						return (
							<li key={presetID} className={className}>
								<a onClick={() => this.onChangeRealismPreset(presetID)}>{presetLabel}</a>
							</li>
						)
					})}
				</ul>
				{launchStore.realismPreset === RealismPreset.Custom && <RealismOptions />}
			</div>
		)
	}

	// Change realism preset event handler
	onChangeRealismPreset(realismPreset) {

		if (realismPreset === launchStore.realismPreset) {
			return
		}

		launchStore.setRealismPreset(realismPreset)
	}
}
