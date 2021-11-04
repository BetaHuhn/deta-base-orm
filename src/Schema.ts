import { BaseSchema, ParsedBaseSchema } from './types'
import { Base } from './Base'

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

		// Overwrite the key as it is required and can't be changed
		parsedSchema.key = {
			__end: true,
			type: 'string',
			required: true,
			default: undefined
		}

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