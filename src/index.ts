/* eslint-disable valid-jsdoc */
import { Deta } from 'deta'
import DetaBase from 'deta/dist/types/base'
import dotenv from 'dotenv'
import { generateKey } from './random'
dotenv.config()

export interface BaseOptions {
	/** Existing Deta Base instance */
	db?: DetaBase,

	/** Generate keys in descending order i.e. newest on top */
	descending?: boolean

	/** Automatically create createdAt field containing the timestamp */
	timestamp?: boolean
}

/**
 * The data of a document
*/
export type BaseDocument<Schema> = Document<Schema> & Schema & {
	/**
	 * The unique key of the document
	 *
	 * Either auto generated or the one you provided.
	 *
	 * */
	key: string

	/**
	 * Timestamp of when the document was created
	 *
	 * Note: Only set when timestamp option is true
	 * */
	createdAt?: number
}

/**
 * Query to use for finding documents
*/
export type Query<Schema> = Partial<Schema | {
	/**
	 * The unique key of the document
	 *
	 * Either auto generated or the one you provided.
	 *
	 * */
	key?: string

	/**
	 * Timestamp of when the document was created
	 *
	 * Note: Only set when timestamp option is true
	 * */
	createdAt?: number
}>

interface ParsedOptions {
	ascending: boolean
	timestamp: boolean
}

/**
 * Create and interact with a Deta Base
*/
export class Base <Schema> {
	_baseName: string
	_db: DetaBase
	_opts: ParsedOptions

	/**
	 * Create a new Base with the provided name, schema and options
	 * @param {string} name Name of the Base
	 * @param {BaseOptions} opts Options object
	*/
	constructor(name: string, opts?: BaseOptions) {
		this._baseName = name

		// Parse options
		const ascending = opts?.descending !== true
		const timestamp = opts?.timestamp || false
		this._opts = { ascending, timestamp }

		// Reuse Deta Base
		const db = opts?.db
		if (db !== undefined) {
			this._db = db
			return
		}

		// Create new Deta Base instance
		const deta = Deta()
		this._db = deta.Base(name)
	}

	/**
	 * Create a new document with the provided data based on the Base schema
	 * @param {Schema} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	create(data: Schema):BaseDocument<Schema> {
		// Set configs
		Document._baseName = this._baseName
		Document._db = this._db
		Document._opts = this._opts

		// Create new document with data
		return Document.create<Schema>(data)
	}

	/**
	 * Helper function to create and immediately save a new document
	 * @param {Schema} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	async save(data: Schema): Promise<BaseDocument<Schema>> {
		const doc = this.create(data)

		await doc.save()

		return doc
	}

	/**
	 * Wrapper around the Deta Base SDK fetch method
	 *
	 * Automatically gets all items until the limit or since the last item
	 * @internal
	*/
	async _fetch(query: any = {}, limit?: number, last?: string): Promise<any[]> {
		let res = await this._db.fetch(query, limit ? { limit, last } : undefined)
		let items: Array<any> = res.items

		// We already have enough data
		if (limit && items.length === limit) return items

		// More data available
		while (res.last) {
			res = await this._db.fetch(query, {
				// If we have a limit set we only need to get the remaining items
				...(limit) && { limit: limit - items.length },

				// Since the last item
				last: res.last
			})

			items = items.concat(items)
		}

		// We have everything
		return items
	}

	/**
	 * Find all documents matching the query.
	 *
	 * Use limit and last to paginate the result.
	 *
	 * @param query A query object
	 * @returns Array of Documents
	*/
	async find(query: Query<Schema> = {}, limit?: number, last?: string): Promise<BaseDocument<Schema>[]> {
		const items = await this._fetch(query, limit, last)

		if (!items) return []

		const res = items.map((item: any) => {
			return this.create(item)
		})

		return res
	}

	/**
	 * Find a single document matching the query.
	 *
	 * @param query A query object
	 * @returns Document
	*/
	async findOne(query: Query<Schema> = {}): Promise<BaseDocument<Schema> | undefined> {
		const res = await this._db.fetch(query as any, { limit: 1 })

		if (res.count < 1) return undefined

		return this.create(res.items[0] as any)
	}

	/**
	 * Find a single document by its key
	 *
	 * @param key The key of the document
	 * @returns Document
	*/
	async findByKey(key: string): Promise<BaseDocument<Schema> | undefined> {
		return this.findOne({ key })
	}

	/**
	 * Find a single document matching the query and update it with the provided data.
	 *
	 * @param query A query object
	 * @param data The data to update
	 * @returns Document
	*/
	async findOneAndUpdate(query: Query<Schema> = {}, data: Partial<Schema>): Promise<BaseDocument<Schema>> {
		const item = await this.findOne(query)
		if (item === undefined) throw new Error('No item with that id exists')

		// Prevent accidently changing immutable attributes
		const newItem = {
			...data,
			key: undefined
		}

		await this._db.update(newItem, item.key)

		return item
	}

	/**
	 * Find a single document by its key and update it with the provided data.
	 *
	 * @param key The key of the document
	 * @param data The data to update
	 * @returns Document
	*/
	async findByKeyAndUpdate(key: string, data: Partial<Schema>): Promise<BaseDocument<Schema>> {
		const item = await this.findByKey(key)
		if (!item) throw new Error('No item with that id exists')

		// Prevent accidently changing immutable attributes
		const newItem = {
			...data,
			key: undefined
		}

		await this._db.update(newItem, item.key)

		return item
	}

	/**
	 * Find a single document by its key and delete it.
	 *
	 * @param key The key of the document
	*/
	async findByKeyAndDelete(key: string): Promise<void> {
		const item = await this.findByKey(key)
		if (!item) throw new Error('No item with that id exists')

		await this._db.delete(item.key)
	}

	/**
	 * Find a single document matching the query and delete it.
	 *
	 * @param query A query object
	*/
	async findOneAndDelete(query: Query<Schema> = {}): Promise<void> {
		const item = await this.findOne(query)
		if (!item) throw new Error('No item with that id exists')

		await this._db.delete(item.key)
	}
}

/**
 * Represents a Document with all of its data and methods
 * @internal
*/
class Document <Schema> {
	// eslint-disable-next-line no-undef
	[k: string]: any
	static _baseName: string
	static _db: DetaBase
	static _opts: ParsedOptions

	/**
	 * Create a new Document instance with the provided data.
	 *
	 * Will auto generate a key if it is missing.
	 * @internal
	*/
	constructor(data: Schema) {
		Object.assign(this, data)
		this.key = this.key || generateKey(Document._opts.ascending)

		// Add timestamp to document
		if (Document._opts.timestamp) {
			this.createdAt = Date.now()
		}
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

	/**
	 * Create a new Document
	 *
	 * Is used instead of the contructor in order to return the data with a different type, ref: https://git.io/JR2Yc
	 * @internal
	*/
	static create <Schema>(data: any) {
		return new Document<Schema>(data) as BaseDocument<Schema>
	}
}