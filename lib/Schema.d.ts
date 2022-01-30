import { BaseSchema, ParsedBaseSchema, SchemaPropertyType } from './types';
/**
 * Create a schema for your Base
*/
export declare class Schema<SchemaType> {
    schema: ParsedBaseSchema;
    static Types: typeof SchemaPropertyType;
    constructor(schema: BaseSchema);
    parse(schema: BaseSchema): ParsedBaseSchema;
    validate(data: SchemaType, partialSchema?: ParsedBaseSchema): {
        errors: string[];
        result: SchemaType;
    };
}
