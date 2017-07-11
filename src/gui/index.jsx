/** @copyright Simas Toleikis, 2016 */
"use strict"

const React = require("react")
const ReactDOM = require("react-dom")
const {HashRouter, Route, Switch, Redirect} = require("react-router-dom")
const {useStrict} = require("mobx")
const Application = require("./app/Application")
const MissionsScreen = require("./missions/Screen")
const CreateMissionScreen = require("./createMission/Screen")

// NOTE: Strict mode makes MobX require actions to modify state!
useStrict(true)

// Render application
ReactDOM.render((
	<HashRouter>
		<Route path="/" render={({match}) => {

			if (match.isExact) {
				return <Redirect to="/missions" />
			}

			return (
				<Application>
					<Switch>
						<Route path="/missions/:mission?" component={MissionsScreen} />
						<Route path="/create" component={CreateMissionScreen} />
					</Switch>
				</Application>
			)
		}}
		/>
	</HashRouter>
), document.getElementById("main"))