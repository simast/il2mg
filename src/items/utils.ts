import getSlug from 'speakingurl'
import {SmartBuffer} from 'smart-buffer'

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
 * Write a string value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value String value to write.
 */
export function writeString(buffer: SmartBuffer, value: string): void {

	const length = Buffer.byteLength(value)

	// NOTE: String values are represented in binary files as a length (32 bit
	// unsigned integer) followed by an array of string byte characters.

	// String length
	writeUInt32(buffer, length)

	// String value
	if (length > 0) {
		buffer.writeString(value)
	}
}

/**
 * Write a 32 bit unsigned integer value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value Number value to write.
 */
export function writeUInt32(buffer: SmartBuffer, value: number): void {
	buffer.writeUInt32LE(value)
}

/**
 * Write a 16 bit unsigned integer value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value Number value to write.
 */
export function writeUInt16(buffer: SmartBuffer, value: number): void {
	buffer.writeUInt16LE(value)
}

/**
 * Write a 8 bit unsigned integer value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value Number value to write.
 */
export function writeUInt8(buffer: SmartBuffer, value: number): void {
	buffer.writeUInt8(value)
}

/**
 * Write a double-precision floating-point value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value Number value to write.
 */
export function writeDouble(buffer: SmartBuffer, value: number): void {
	buffer.writeDoubleLE(value)
}

/**
 * Write a single-precision floating-point value to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param value Number value to write.
 */
export function writeFloat(buffer: SmartBuffer, value: number): void {
	buffer.writeFloatLE(value)
}

/**
 * Write an array of 32 bit unsigned integer values to the given buffer object.
 *
 * @param buffer Target SmartBuffer object.
 * @param values List of integer values to write.
 */
export function writeUInt32Array(buffer: SmartBuffer, values: ReadonlyArray<number>): void {

	// Array length
	writeUInt32(buffer, values.length)

	// Array values
	for (const value of values) {
		writeUInt32(buffer, value)
	}
}
