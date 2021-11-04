/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable valid-jsdoc */
import { Deta } from 'deta'
import DetaBase from 'deta/dist/types/base'

import { generateKey } from './random'
import { OfflineDB } from './Offline'

import { ParsedOptions } from './types'
import { Schema } from './Schema'

/**
 * Represents a Document with all of its data and methods
 * @internal
*/
export class Document <SchemaType> {
	// eslint-disable-next-line no-undef
	[k: string]: any
	static _baseName: string
	static _db: DetaBase | OfflineDB
	static _opts: ParsedOptions
	_baseSchema?: Schema<SchemaType>

	/**
	 * Create a new Document instance with the provided data.
	 *
	 * Will auto generate a key if it is missing.
	 * @internal
	*/
	constructor(data: SchemaType, _baseSchema: Schema<SchemaType>) {
		Object.assign(this, data)
		this.key = this.key || generateKey(Document._opts.ascending)

		// Add timestamp to document
		if (Document._opts.timestamp && this.createdAt === undefined) {
			this.createdAt = Date.now()
		}

		Object.defineProperty(this, '_baseSchema', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: _baseSchema
		})
	}

	/**
	 * Update the document with the provided data
	 *
	 * @param data The data to update
	*/
	update(data: any) {
		return data
	}

	/**
	 * Delete the document
	*/
	async delete() {
		await Document._db.delete(this.key as string)
	}

	/**
	 * Populate a sub-document
	*/
	async populate(path: string) {
		const pathObj = this._baseSchema?.schema[path]
		if (!pathObj) throw new Error(`No path with that name found to populate`)

		const baseName = pathObj?.baseName
		if (!baseName) throw new Error(`Can't populate this path because it doesn't have a baseName defined`)

		// Create new Deta Base instance
		const deta = Deta()
		const db = deta.Base(baseName)

		const key = this[path]

		const rawData = await db.get(key)
		if (rawData === null) throw new Error(`No item with that key exists in the base ${ baseName }`)

		const schemaOfPath = pathObj.baseSchema
		if (schemaOfPath) {
			const validated = schemaOfPath.validate(rawData as any)

			// Log all errors and throw first one
			if (validated.errors && validated.errors.length > 0) {
				validated.errors.forEach((err) => console.error('Validation error: ' + err))
				throw new Error(validated.errors[0])
			}

			this[path] = validated.result
		} else {
			this[path] = rawData
		}

		// Todo: Make resolved Document typed based on referenced Base
		return this[path]
	}

	/**
	 * Save the Document to the database
	 *
	 * @returns Document
	*/
	async save() {
		const toBeCreated = {
			...this
		}

		// Use put and not insert as we can assume our random key doesn't exist
		const newItem = await Document._db.put(toBeCreated)

		if (!newItem) throw new Error('Could not create item')

		return this
	}
}