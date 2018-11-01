import fs from 'fs'
import Lexer from 'lex'

import {Item} from '../items'
import {isValidItemType, getItemClassByType} from '../items/mappings'

/**
 * Read a list of items from a text file.
 *
 * @param filePath Item text file name/path.
 * @returns List of items.
 */
export function readItemsFromTextFile(filePath: string): Item[] {

	const fileContent = fs.readFileSync(filePath, {encoding: 'ascii'})

	if (!fileContent.length) {
		throw new Error('Could not read specified item file (no content).')
	}

	const lexer = new Lexer()
	const items: Item[] = []
	const itemStack: Item[] = []

	// Rule for the start of item definition
	lexer.addRule(/\s*(\w+)\s*{\s*/i, (_matched, itemType) => {

		if (!isValidItemType(itemType)) {
			throw new Error(`Unknown item type: "${itemType}".`)
		}

		const item = new (getItemClassByType(itemType))()

		// Add new item to active items stack
		itemStack.push(item)
	})

	// Rule for item property
	lexer.addRule(/\s*(\w+)\s*=\s*(.+);\s*/i, (_matched, propName, propValue) => {

		const item: any = itemStack[itemStack.length - 1]

		// Escape backslash (\) character for JavaScript strings
		propValue = propValue.replace(/\\/g, '\\\\')

		// TODO: Handle complex property types (like with the Options item)

		// Add item property
		item[propName] = JSON.parse(propValue)
	})

	// Rule for the end of item definition
	lexer.addRule(/\s*}\s*/i, () => {

		const item = itemStack.pop()

		if (!item) {
			return
		}

		// Child item element
		if (itemStack.length) {
			itemStack[itemStack.length - 1].addItem(item)
		}
		// Root item element
		else {
			items.push(item)
		}
	})

	lexer.setInput(fileContent)
	lexer.lex()

	// Make sure the stack is empty
	if (itemStack.length) {
		throw new Error()
	}

	return items
}
