/* eslint-disable valid-jsdoc */
import { Deta } from 'deta'
import DetaBase from 'deta/dist/types/base'
import dotenv from 'dotenv'
import { generateKey } from './random'
dotenv.config()

export interface BaseOptions {
	/** Existing Deta Base instance */
	db?: DetaBase,

	/**
	 * Generate keys in descending order i.e. newest on top
	 * @default false
	 */
	descending?: boolean

	/**
	 * Automatically create createdAt field containing the timestamp
	 * @default false
	 */
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
 * Operators to use in a query
*/
export type QueryOperators = {
	/** Equal to */
	$eq?: BaseValueType,
	/** Not equal to */
	$ne?: BaseValueType,
	/** Less Than */
	$lt?: number,
	/** Greater than */
	$gt?: number,
	/** Less than or equal  */
	$lte?: number,
	/** Greater than or equal  */
	$gte?: number,
	/** Prefix */
	$pfx?: string,
	/** Range */
	$rg?: number[],
	/** Contains */
	$con?: string,
	/** Not contains */
	$ncon?: string
}

/**
 * Add operators to each property of a Schema
*/
type SchemaWithOperators<SchemaType> = {
	[Property in keyof SchemaType]: SchemaType[Property] | QueryOperators;
}

/**
 * Query to use for finding documents
*/
export type Query<SchemaType> = Partial<SchemaType | {
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
} | SchemaWithOperators<SchemaType>>

interface ParsedOptions {
	ascending: boolean
	timestamp: boolean
}

// eslint-disable-next-line @typescript-eslint/ban-types
type BaseValueType = string | number | boolean | object | BaseValueType[]

interface SchemaOptions {
	type: string
	required?: boolean
	default?: BaseValueType
	base?: Base<BaseSchema>
	baseName?: string
	baseSchema?: Schema<BaseSchema>
}

export interface BaseSchema {
	[key: string]: string | BaseSchema | SchemaOptions | Base<BaseSchema>
}

/* Internal Types */
interface ParsedSchemaOptions {
	type: string
	required: boolean
	__end: boolean
	default?: BaseValueType
	base?: Base<BaseSchema>
	baseName?: string
	baseSchema?: Schema<BaseSchema>
}

interface ParsedBaseSchema {
	[key: string]: ParsedSchemaOptions
}

/**
 * Create a schema for your Base
*/
export class Schema<SchemaType> {
	schema: ParsedBaseSchema

	constructor(schema: BaseSchema) {
		this.schema = this.parse(schema)
	}

	parse(schema: BaseSchema): ParsedBaseSchema {
		const parsedSchema: any = {}
		const validTypes = [ 'string', 'number', 'boolean', 'array', 'object', 'base' ]

		Object.entries(schema).forEach(([ key, value ]) => {

			// Parse type shorthand notation
			if (typeof value === 'string') {
				parsedSchema[key] = {
					__end: true,
					type: value,
					required: false,
					default: undefined
				}

			// Parse Base shorthand notation
			} else if (value instanceof Base) {
				parsedSchema[key] = {
					__end: true,
					type: 'base',
					baseName: value._baseName,
					baseSchema: value._baseSchema,
					required: false,
					default: undefined
				}

			// Recursivly parse none schema object
			} else if (typeof value === 'object' && (!value.type || typeof value.type !== 'string')) {
				parsedSchema[key] = this.parse(value as any)

			// Parse schema object
			} else {
				parsedSchema[key] = {
					__end: true,
					type: value.type || 'string',
					required: value.required !== undefined ? value.required : value.default === undefined,
					default: value.default !== undefined ? value.default : undefined
				}

				if (value.type === 'base') {
					if (value.base) {
						parsedSchema[key].baseName = (value.base as Base<BaseSchema>)._baseName
						parsedSchema[key].baseSchema = (value.base as Base<BaseSchema>)._baseSchema
					} else {
						parsedSchema[key].baseName = value.baseName !== undefined ? value.baseName : undefined
						parsedSchema[key].baseSchema = value.baseSchema !== undefined ? value.baseSchema : undefined
					}
				}
			}

			// Verify that types are valid
			if (typeof parsedSchema[key].type === 'string' && !validTypes.includes(parsedSchema[key].type)) {
				throw new Error(`Invalid type "${ parsedSchema[key].type }"`)
			}
		})

		return parsedSchema
	}

	validate(data: SchemaType, partialSchema?: ParsedBaseSchema): { errors: string[], result: SchemaType } {
		if (!data) throw new Error(`Can't validate missing data`)

		let errors: string[] = []
		let result: Partial<SchemaType> = {}

		const schema = partialSchema || this.schema

		// Helper function to set keys without overwriting whole object
		const setRes = (key: string, value: any) => {
			result = { ...result, [key]: value }
		}

		// Helper function to check JS types
		const checkType = (type: string, value: any) => {
			if (type === 'string') {
				return typeof value === 'string'
			} else if (type === 'number') {
				return typeof value === 'number'
			} else if (type === 'boolean') {
				return typeof value === 'boolean'
			} else if (type === 'array') {
				return Array.isArray(value)
			} else if (type === 'object') {
				return typeof value === 'object'
			} else if (type === 'base') {
				return typeof value === 'string'
			}
		}

		Object.entries(schema).forEach(([ key, value ]) => {

			// If the value is not a schema object, we need to validate it recursivly
			if (typeof value === 'object' && value.__end === undefined) {
				const obj = this.validate((data as any)[key], value as any)
				errors = errors.concat(obj.errors)
				setRes(key, obj.result)

			// Check if the value is required and is present
			} else if (value.required && (data as any)[key] === undefined) {
				errors.push(`Missing required field "${ key }"`)

			// If no value use default value if present
			} else if (data === undefined || (data as any)[key] === undefined) {
				if (schema[key].default !== undefined) {
					setRes(key, schema[key].default)
				}

			// If the value is present, validate its type
			} else if (!checkType(value.type, (data as any)[key])) {
				errors.push(`Invalid type for "${ key }": expected "${ value.type }", got "${ typeof (data as any)[key] }"`)

			// Use the actual value
			} else {
				setRes(key, (data as any)[key])
			}
		})

		return { errors, result: result as SchemaType }
	}
}

/**
 * Create and interact with a Deta Base
*/
export class Base <SchemaType> {
	_baseName: string
	_baseSchema: Schema<SchemaType>
	_db: DetaBase
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
	 * @param {SchemaType} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	create(rawData: SchemaType):BaseDocument<SchemaType> {
		// Set configs
		Document._baseName = this._baseName
		Document._db = this._db
		Document._opts = this._opts

		const validated = this._baseSchema.validate(rawData)

		// Log all errors and throw first one
		if (validated.errors && validated.errors.length > 0) {
			validated.errors.forEach((err) => console.error('Validation error: ' + err))
			throw new Error(validated.errors[0])
		}

		const data = validated.result

		// Create new document with data
		return new Document<SchemaType>(data, this._baseSchema) as BaseDocument<SchemaType>
	}

	/**
	 * Helper function to create and immediately save a new document
	 * @param {SchemaType} data Object representing the data of the new document
	 * @returns {BaseDocument} Document
	 */
	async save(data: SchemaType): Promise<BaseDocument<SchemaType>> {
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

/**
 * Represents a Document with all of its data and methods
 * @internal
*/
class Document <SchemaType> {
	// eslint-disable-next-line no-undef
	[k: string]: any
	static _baseName: string
	static _db: DetaBase
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