import DetaBase from 'deta/dist/types/base'
import { Base } from './Base'
import { Schema } from './Schema'
import { Document } from './Document'

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

	/**
	 * Enable offline mode
	 *
	 * It will use a local mock database instead of connecting to the remote Deta database
	 * @default false
	 */
	offline?: boolean

	/**
	 * The path to store the local mock Bases at
	 *
	 * File name will be basename.json
	 * @default .deta-base-orm/
	 */
	storagePath?: string
}

export type DocumentData<Schema> = Schema & {
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
 * The data of a document
*/
export type BaseDocument<Schema> = Document<Schema> & DocumentData<Schema>


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
export type SchemaWithOperators<SchemaType> = {
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

export interface ParsedOptions {
	ascending: boolean
	timestamp: boolean
	offline: boolean
	storagePath: string
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseValueType = string | number | boolean | object | BaseValueType[]

export interface SchemaOptions {
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

/**
 * The full schema of a document
*/
export type FullSchema<Schema> = Schema & {
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
}

/* Internal Types */
export interface ParsedSchemaOptions {
	type: string
	required: boolean
	__end: boolean
	default?: BaseValueType
	base?: Base<BaseSchema>
	baseName?: string
	baseSchema?: Schema<BaseSchema>
}

export interface ParsedBaseSchema {
	[key: string]: ParsedSchemaOptions
}