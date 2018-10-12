import React from 'react'

// Data choice list item component
export default class ChoiceListItem extends React.Component {

	shouldComponentUpdate(nextProps) {

		const nextChoice = nextProps.choice
		const prevChoice = this.props.choice

		// Update choice list item only on valid/selected state change
		return (nextChoice.valid !== prevChoice.valid ||
						nextChoice.selected !== prevChoice.selected)
	}

	// Render component
	render() {

		const {choice, onChoiceClick} = this.props
		const data = choice.data
		let suffix, alias

		if (data.suffix) {
			suffix = <span>{' ' + data.suffix}</span>
		}

		if (data.alias) {
			alias = <em>{' “' + data.alias + '”'}</em>
		}

		const propsItem = {}
		const propsLink = {
			onClick: () => {
				onChoiceClick(choice.id)
			}
		}

		const className = []

		if (data.country) {
			className.push('country', 'c' + data.country)
		}

		if (choice.selected) {
			className.push('selected')
		}
		else if (!choice.valid) {
			propsItem.className = 'invalid'
		}

		if (className.length) {
			propsLink.className = className.join(' ')
		}

		return (
			<li {...propsItem}>
				<a {...propsLink}>{data.name}{suffix}{alias}</a>
			</li>
		)
	}
}
