import fs from 'fs'
import getSlug from 'speakingurl'
import Lexer from 'lex'

import {Item} from './item'

/**
 * Convert Unicode text to ASCII character set.
 *
 * @param value Unicode text.
 * @returns Converted text.
 */
export function convertUnicodeToASCII(value: string): string {

	// NOTE: The .Mission file parser does not seem to support UTF-8/unicode
	// characters and will fail to load the mission when there are any. Also,
	// in-game labels for planes/vehicles will not display UTF-8 characters as
	// well. As a workaround we transliterate all non-localized strings to a safe
	// ASCII character set.
	return getSlug(value, {
		lang: 'en',
		separator: ' ',
		symbols: false,
		maintainCase: true,
		titleCase: false,
		uric: true,
		mark: true
	})
}

/**
 * Read a list of items from a text file.
 *
 * @param filePath Item text file name/path.
 * @returns List of items.
 */
export function readTextFile(filePath: string): Item[] {

	const fileContent = fs.readFileSync(filePath, {encoding: 'ascii'})

	if (!fileContent.length) {
		throw new Error('Could not read specified item file (no content).')
	}

	const lexer = new Lexer()
	const items: Item[] = []
	const itemStack: Item[] = []

	// Rule for the start of item definition
	lexer.addRule(/\s*(\w+)\s*{\s*/i, (_matched, itemType) => {

		let item: Item

		// Normal item
		if (itemType in Item) {
			item = new (Item as any)[itemType]()
		}
		// Generic item
		else {
			item = new Item(itemType)
		}

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
