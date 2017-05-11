/** @copyright Simas Toleikis, 2016 */
"use strict"

const React = require("react")
const ReactDOM = require("react-dom")
const {HashRouter, Route, Switch, Redirect} = require("react-router-dom")
const Application = require("./components/Application")
const Missions = require("./components/Missions")
const CreateMission = require("./components/CreateMission")

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
						<Route path="/missions/:mission?" component={Missions} />
						<Route path="/create" component={CreateMission} />
					</Switch>
				</Application>
			)
		}}
		/>
	</HashRouter>
), document.getElementById("main"))