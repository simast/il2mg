import {data} from '../data'

// Make airfield windsock item
export default function makeAirfieldWindsock(airfield, item) {

	if (!airfield.country) {
		return
	}

	const windsockItem = this.createItem(data.getItemType(item[5]), false)

	windsockItem.setPosition(item[1], item[2], item[3])
	windsockItem.setOrientation(item[4])
	windsockItem.StartHeight = 1

	windsockItem.createEntity(true)

	// Attach windsock to airfield "bubble" zone
	airfield.zone.onActivate.addObject(windsockItem)
	airfield.zone.onDeactivate.addObject(windsockItem)

	return [windsockItem]
}
