import { BaseSchema, ParsedBaseSchema } from './types';
/**
 * Create a schema for your Base
*/
export declare class Schema<SchemaType> {
    schema: ParsedBaseSchema;
    constructor(schema: BaseSchema);
    parse(schema: BaseSchema): ParsedBaseSchema;
    validate(data: SchemaType, partialSchema?: ParsedBaseSchema): {
        errors: string[];
        result: SchemaType;
    };
}
