/* eslint-disable valid-jsdoc */
import { Deta } from 'deta'
import DetaBase from 'deta/dist/types/base'

import { generateKey } from './random'
import { OfflineDB } from './Offline'

import { ParsedOptions, BaseSchema, BaseOptions, BaseDocument, Query, FullSchema } from './types'
import { Schema } from './Schema'
import { Document } from './Document'

/**
 * Create and interact with a Deta Base
*/
export class Base <SchemaType> {
	_baseName: string
	_baseSchema: Schema<SchemaType>
	_db: DetaBase | OfflineDB
	_opts: ParsedOptions

	/**
	 * Create a new Base with the provided name, schema and options
	 * @param {string} name Name of the Base
	 * @param {BaseOptions} opts Options object
	*/
	constructor(name: string, schema: BaseSchema | Schema<SchemaType>, opts?: BaseOptions) {
		this._baseName = name

		if (schema instanceof Schema) {
			this._baseSchema = schema as Schema<SchemaType>
		} else {
			this._baseSchema = new Schema(schema as BaseSchema)
		}

		// Parse options
		const ascending = opts?.descending !== true
		const timestamp = opts?.timestamp || false
		const offline = opts?.offline || false
		const storagePath = opts?.storagePath || '.deta-base-orm'
		this._opts = { ascending, timestamp, offline, storagePath }

		if (this._opts.offline) {
			this._db = new OfflineDB(this._opts.storagePath, this._baseName)
			return
		}

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
	 * @param {SchemaType} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	create(rawData: FullSchema<SchemaType>):BaseDocument<SchemaType> {
		// Auto generate a key if is missing
		if (!rawData.key) {
			rawData.key = generateKey(this._opts.ascending)
		}

		// Add timestamp to document
		if (this._opts.timestamp && rawData.createdAt === undefined) {
			rawData.createdAt = Date.now()
		}

		const validated = this._baseSchema.validate(rawData)

		// Log all errors and throw first one
		if (validated.errors && validated.errors.length > 0) {
			validated.errors.forEach((err) => console.error('Validation error: ' + err))
			throw new Error(validated.errors[0])
		}

		const data = validated.result

		// Create new document with data
		return new Document<SchemaType>(data, this._baseSchema, this._baseName, this._db, this._opts) as BaseDocument<SchemaType>
	}

	/**
	 * Helper function to create and immediately save a new document
	 * @param {SchemaType} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	async save(data: FullSchema<SchemaType>): Promise<BaseDocument<SchemaType>> {
		const doc = this.create(data)

		await doc.save()

		return doc
	}

	_parseQuery(queryObj: Query<SchemaType>): any {
		const queries = Object.entries(queryObj)
		const result: any = {}

		queries.forEach(([ key, query ]) => {
			if (typeof query !== 'object' || query === null) {
				return result[key] = query
			}

			const properties = Object.entries(query)
			properties.forEach(([ operator, value ]) => {
				if (!operator.startsWith('$')) return

				if (operator === '$con') {
					result[`${ key }?contains`] = value
				} else if (operator === '$ncon') {
					result[`${ key }?!contains`] = value
				} else if (operator === '$rg') {
					result[`${ key }?r`] = value
				} else if (operator === '$eq') {
					result[key] = value
				} else {
					result[`${ key }?${ operator.slice(1) }`] = value
				}
			})
		})

		return result
	}

	/**
	 * Wrapper around the Deta Base SDK fetch method
	 *
	 * Automatically gets all items until the limit or since the last item
	 * @internal
	*/
	async _fetch(query: any = {}, limit?: number, last?: string): Promise<{ items: any[], last?: string }> {

		const queries = Array.isArray(query) ? query : [ query ]
		const parsedQuery = queries.map(this._parseQuery)

		let res = await this._db.fetch(parsedQuery, limit ? { limit, last } : undefined)
		let items: Array<any> = res.items

		// We already have enough data
		if (limit && items.length === limit) return { items, last: res.last }

		// More data available
		while (res.last) {
			res = await this._db.fetch(parsedQuery, {
				// If we have a limit set we only need to get the remaining items
				...(limit) && { limit: limit - items.length },

				// Since the last item
				last: res.last
			})

			items = items.concat(items)
		}

		// We have everything
		return { items }
	}

	/**
	 * Find all documents matching the query.
	 *
	 * Use limit and last to paginate the result.
	 *
	 * @param query A query object or array of query objects
	 * @param limit Maximum number of items to return
	 * @param last The key of the last item to start from
	 * @returns Array of Documents
	*/
	async find(query: Query<SchemaType> | Query<SchemaType>[] = {}, limit?: number, last?: string): Promise<BaseDocument<SchemaType>[]> {
		const res = await this._fetch(query, limit, last)

		if (!res.items) return []

		const result = res.items.map((item: any) => {
			return this.create(item)
		})

		return result
	}

	/**
	 * Find a single document matching the query.
	 *
	 * @param query A query object
	 * @returns Document
	*/
	async findOne(query: Query<SchemaType> | Query<SchemaType>[] = {}): Promise<BaseDocument<SchemaType> | undefined> {
		const res = await this._fetch(query as any, 1)

		if (res.items.length < 1) return undefined

		return this.create(res.items[0] as any)
	}

	/**
	 * Find a single document by its key
	 *
	 * @param key The key of the document
	 * @returns Document
	*/
	async findByKey(key: string): Promise<BaseDocument<SchemaType> | undefined> {
		const res = await this._db.get(key)

		if (!res) return undefined

		return this.create(res as any)
	}

	/**
	 * Find a single document matching the query and update it with the provided data.
	 *
	 * @param query A query object
	 * @param data The data to update
	 * @returns Document
	*/
	async findOneAndUpdate(query: Query<SchemaType> | Query<SchemaType>[] = {}, data: Partial<SchemaType>): Promise<BaseDocument<SchemaType>> {
		const item = await this.findOne(query)
		if (item === undefined) throw new Error('No item with that key exists')

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
	async findByKeyAndUpdate(key: string, data: Partial<SchemaType>): Promise<BaseDocument<SchemaType>> {
		const item = await this.findByKey(key)
		if (!item) throw new Error('No item with that key exists')

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
		if (!item) throw new Error('No item with that key exists')

		await this._db.delete(item.key)
	}

	/**
	 * Find a single document matching the query and delete it.
	 *
	 * @param query A query object
	*/
	async findOneAndDelete(query: Query<SchemaType> | Query<SchemaType>[] = {}): Promise<void> {
		const item = await this.findOne(query)
		if (!item) throw new Error('No item with that key exists')

		await this._db.delete(item.key)
	}
}