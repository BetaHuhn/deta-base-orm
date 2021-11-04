/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { join } from 'path'
import fs from 'fs'

import { Low, JSONFile, Adapter } from 'lowdb'
import lodash from 'lodash'

class LowDash <T> extends Low <T> {
	chain?: lodash.CollectionChain<any> & lodash.FunctionChain<any> & lodash.ObjectChain<any> & lodash.PrimitiveChain<any> & lodash.StringChain
	constructor(adapter: Adapter<T>) {
		super(adapter)
	}
}

/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
export class OfflineDB {

	db: LowDash<any>
	_didLoad: boolean

	constructor(storagePath = '.deta-base-orm', fileName = 'base') {

		const folderExists = fs.existsSync(storagePath)
		if (!folderExists) {
			if (storagePath !== '.deta-base-orm') {
				throw new Error(`The folder "${ storagePath }" does not exist, please create it manually`)
			}

			fs.mkdirSync(storagePath)
		}

		const file = join(storagePath, `${ fileName }.json`)

		const adapter = new JSONFile<any>(file)
		this.db = new LowDash<any>(adapter)

		this._didLoad = false
	}

	/**
	 * Create a new instance of the OfflineDB with the file loaded automatically
	 * @param storagePath The path where the JSON file
	 * @param fileName The filename of the JSON file
	 * @returns OfflineDB
	 */
	static async create(storagePath?: string, fileName?: string) {
		const db = new OfflineDB(storagePath, fileName)
		await db.init()

		return db
	}

	/**
	 * Initializes the database by loading the JSON file
	 */
	async init() {
		await this.db.read()

		if (this.db.data === null) {
			this.db.data = []
		}

		this.db.chain = lodash.chain(this.db.data)

		this._didLoad = true
	}

	/**
	 * Checks if the database was loaded and if not initialize it
	 */
	async check() {
		if (!this._didLoad) {
			await this.init()
		}
	}

	/**
	 * Implements the put API
	 * @param data The data to be inserted
	 * @returns The inserted data
	 */
	async put(data: any) {
		await this.check()

		this.db.data.push(data)
		await this.db.write()

		return data
	}

	/**
	 * Lists all items in the database
	 * @returns All items in the database
	 */
	async list() {
		await this.check()

		return this.db.chain?.value()
	}

	/**
	 * Implements the get API
	 * @param key The key of the item to be retrieved
	 * @returns The item
	 */
	async get(key: string) {
		await this.check()

		return this.db.chain?.find({ key }).value() || null
	}

	/**
	 * Implements the fetch API
	 *
	 * Note: Limits/paging is not implemented yet, everything is returned
	 * Note: Advanced query paramaters are also not yet supported
	*/
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
	async fetch(query: any, fetchOptions?: any) {
		await this.check()

		let results: any[] = []
		query.forEach((query: any) => {
			const items = this.db.chain?.filter(query).value()

			results = lodash.unionBy(results, items, 'key')
		})

		if (!results) {
			return { items: [], count: 0, last: undefined }
		}

		// Limiting is not yet implemented, so everything is returned and last is set to undefined
		return { items: results, count: results.length, last: undefined }
	}

	/**
	 * Implements the delete API
	 * @param key The key of the item to be deleted
	 * @returns null if the item was deleted
	 */
	async delete(key: string) {
		await this.check()

		this.db.chain?.remove({ key }).value()
		await this.db.write()

		return null
	}

	/**
	 * Implements the update API
	 * @param updates The updates to be applied
	 * @param key The key of the item to be updated
	 * @returns	The updated item
	 */
	async update(updates: any, key: string) {
		await this.check()

		this.db.chain?.update(key, updates).value()
		await this.db.write()

		return null
	}

	// Missing methods util, insert, putMany
}