import { nanoid } from 'nanoid'

// Used as large number to make sure keys are generated in descending order
const maxDateNowValue = 8.64e15 // Fun fact: This will only work until the year 275760

/**
 * Generate a unique key in ascending or descending sequential order
 *
 * In ascending mode it will use the Unix timestamp directly
 * and in descending order the maxDateNowValue (8.64e15) - Unix timestamp
 * to make sure key is sequential. Key will be timestamp in hex plus a 5 char random id.
 *
 * Note: Because of the timestamp in ms, key is only sequential until a certain point i.e two keys generated in the same ms.
 * @param {boolean} ascending
 * @returns {string} randomKey
 */
export const generateKey = (ascending: boolean): string => {

	const timestamp = ascending ? Date.now() : maxDateNowValue - Date.now()

	return `${ timestamp.toString(16) }${ nanoid(5) }`
}