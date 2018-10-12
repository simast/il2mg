import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter, Route, Switch, Redirect} from 'react-router-dom'
import {configure} from 'mobx'
import Application from './app/Application'
import MissionsScreen from './missions/Screen'
import CreateScreen from './create/Screen'

// Configure MobX
configure({
	enforceActions: 'observed',
	computedRequiresReaction: true
})

// Create main application container element
const createAppContainer = () => {

	const appContainer = document.createElement('div')
	appContainer.id = 'main'

	return document.body.appendChild(appContainer)
}

// Render application
ReactDOM.render((
	<HashRouter>
		<Route
			path="/"
			render={({match}) => {

				if (match.isExact) {
					return <Redirect to="/missions" />
				}

				return (
					<Application>
						<Switch>
							<Route path="/missions/:mission?/:action?" component={MissionsScreen} />
							<Route path="/create" component={CreateScreen} />
						</Switch>
					</Application>
				)
			}}
		/>
	</HashRouter>
), createAppContainer())
