/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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

export type DocumentResponse<Schema> = Document<Schema> & Schema & {
	/** The unique key of the document */
	key: string

	/** 
	 * Timestamp of when the document was created
	 * 
	 * Note: Only set when timestamp option is true
	 * */
	createdAt?: number
}


interface Options {
	ascending: boolean
	timestamp: boolean
}

export class Base <Schema> {
	// eslint-disable-next-line no-undef
	_baseName: string
	_db: DetaBase
	_opts: Options

	constructor(name: string, opts?: BaseOptions) {
		this._baseName = name

		const ascending = opts?.descending !== true
		const timestamp = opts?.timestamp || false

		this._opts = { ascending, timestamp }

		const db = opts?.db

		if (db !== undefined) {
			this._db = db
			return
		}

		const deta = Deta()
		this._db = deta.Base(name)
	}

	create(data: Schema) {
		Document._baseName = this._baseName
		Document._db = this._db
		Document._opts = this._opts
		return Document.create<Schema>(data)
	}

	async save(data: Schema) {
		const doc = this.create(data)

		await doc.save()

		return doc
	}

	async _fetch(query: any = {}, limit?: number, last?: string) {
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

	async find(query: any = {}, limit?: number, last?: string) {
		const items = await this._fetch(query, limit, last)

		if (!items) return []

		const res = items.map((item: any) => {
			return this.create(item)
		})

		return res
	}

	async findOne(query: any): Promise<DocumentResponse<Schema> | undefined> {
		const res = await this._db.fetch(query, { limit: 1 })

		if (res.count < 1) return undefined

		return this.create(res.items[0] as any)
	}

	async findById(id: string) {
		return this.findOne({ id })
	}

	async findOneAndUpdate(query: any, data: any) {
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

	async findByIdAndUpdate(id: string, data: any) {
		const item = await this.findById(id)
		if (!item) throw new Error('No item with that id exists')

		// Prevent accidently changing immutable attributes
		const newItem = {
			...data,
			key: undefined
		}

		await this._db.update(newItem, item.key)

		return item
	}

	async findByIdAndDelete(id: string) {
		const item = await this.findById(id)
		if (!item) throw new Error('No item with that id exists')

		await this._db.delete(item.key)

		return true
	}

	async findOneAndDelete(query: any) {
		const item = await this.findOne(query)
		if (!item) throw new Error('No item with that id exists')

		await this._db.delete(item.key)

		return true
	}
}

export class Document <Schema> {
	// eslint-disable-next-line no-undef
	[k: string]: any
	static _baseName: string
	static _db: DetaBase
	static _opts: Options

	constructor(data: Schema) {
		Object.assign(this, data)
		this.key = this.key || generateKey(Document._opts.ascending)

		// Add timestamp to document
		if (Document._opts.timestamp) {
			this.createdAt = Date.now()
		}
	}

	update(changes: any) {
		return changes
	}

	async delete() {
		await Document._db.delete(this.key as string)
		return true
	}

	async save() {
		const toBeCreated = {
			...this
		}

		// Use put and not insert as we can assume our random key doesn't exist
		const newItem = await Document._db.put(toBeCreated)

		if (!newItem) throw new Error('Could not create item')

		return this
	}

	static create <Schema>(data: any) {
		return new Document<Schema>(data) as DocumentResponse<Schema>
	}
}