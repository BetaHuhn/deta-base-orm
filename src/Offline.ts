/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { join } from 'path'
import fs from 'fs'

import low from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import { ObjectChain, unionBy } from 'lodash'

interface DbSchema {
	[k: string]: [any]
}

/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
export class OfflineDB {

	_db?: low.LowdbAsync<DbSchema>
	_adapter: any
	_didLoad: boolean
	_filePath: string
	_baseName: string

	constructor(storagePath = '.deta-base-orm', fileName = 'base') {

		const folderExists = fs.existsSync(storagePath)
		if (!folderExists) {
			if (storagePath !== '.deta-base-orm') {
				throw new Error(`The folder "${ storagePath }" does not exist, please create it manually`)
			}

			fs.mkdirSync(storagePath)
		}

		const file = join(storagePath, `${ fileName }.json`)

		this._baseName = fileName
		this._filePath = file
		this._adapter = new FileAsync<DbSchema>(file)
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
		this._db = await low(this._adapter)

		await this._db.read()

		if (this._db.get(this._baseName).value() === undefined) {
			await this._db.set(this._baseName, []).write()
		}

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

		await this._db?.get(this._baseName).push(data).write()

		return data
	}

	/**
	 * Lists all items in the database
	 * @returns All items in the database
	 */
	async list() {
		await this.check()

		return this._db?.value()
	}

	/**
	 * Implements the get API
	 * @param key The key of the item to be retrieved
	 * @returns The item
	 */
	async get(key: string) {
		await this.check()

		return this._db?.get(this._baseName).find({ key }).value() || null
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
			const items = this._db?.get(this._baseName).filter(query).value()

			results = unionBy(results, items, 'key')
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

		await this._db?.get(this._baseName).remove({ key }).write()

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

		const item = this._db?.get(this._baseName).find({ key })

		await (item as ObjectChain<any>).assign(updates).write()

		return null
	}

	// Missing methods util, insert, putMany
}