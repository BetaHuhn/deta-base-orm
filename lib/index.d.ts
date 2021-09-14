import DetaBase from 'deta/dist/types/base';
export interface BaseOptions {
    /** Existing Deta Base instance */
    db?: DetaBase;
    /**
     * Generate keys in descending order i.e. newest on top
     * @default false
     */
    descending?: boolean;
    /**
     * Automatically create createdAt field containing the timestamp
     * @default false
     */
    timestamp?: boolean;
}
/**
 * The data of a document
*/
export declare type BaseDocument<Schema> = Document<Schema> & Schema & {
    /**
     * The unique key of the document
     *
     * Either auto generated or the one you provided.
     *
     * */
    key: string;
    /**
     * Timestamp of when the document was created
     *
     * Note: Only set when timestamp option is true
     * */
    createdAt?: number;
};
/**
 * Operators to use in a query
*/
export declare type QueryOperators = {
    /** Equal to */
    $eq?: BaseValueType;
    /** Not equal to */
    $ne?: BaseValueType;
    /** Less Than */
    $lt?: number;
    /** Greater than */
    $gt?: number;
    /** Less than or equal  */
    $lte?: number;
    /** Greater than or equal  */
    $gte?: number;
    /** Prefix */
    $pfx?: string;
    /** Range */
    $rg?: number[];
    /** Contains */
    $con?: string;
    /** Not contains */
    $ncon?: string;
};
/**
 * Add operators to each property of a Schema
*/
declare type SchemaWithOperators<SchemaType> = {
    [Property in keyof SchemaType]: SchemaType[Property] | QueryOperators;
};
/**
 * Query to use for finding documents
*/
export declare type Query<SchemaType> = Partial<SchemaType | {
    /**
     * The unique key of the document
     *
     * Either auto generated or the one you provided.
     *
     * */
    key?: string;
    /**
     * Timestamp of when the document was created
     *
     * Note: Only set when timestamp option is true
     * */
    createdAt?: number;
} | SchemaWithOperators<SchemaType>>;
interface ParsedOptions {
    ascending: boolean;
    timestamp: boolean;
}
declare type BaseValueType = string | number | boolean | object | BaseValueType[];
interface SchemaOptions {
    type: string;
    required?: boolean;
    default?: BaseValueType;
    base?: Base<BaseSchema>;
    baseName?: string;
    baseSchema?: Schema<BaseSchema>;
}
export interface BaseSchema {
    [key: string]: string | BaseSchema | SchemaOptions | Base<BaseSchema>;
}
interface ParsedSchemaOptions {
    type: string;
    required: boolean;
    __end: boolean;
    default?: BaseValueType;
    base?: Base<BaseSchema>;
    baseName?: string;
    baseSchema?: Schema<BaseSchema>;
}
interface ParsedBaseSchema {
    [key: string]: ParsedSchemaOptions;
}
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
/**
 * Create and interact with a Deta Base
*/
export declare class Base<SchemaType> {
    _baseName: string;
    _baseSchema: Schema<SchemaType>;
    _db: DetaBase;
    _opts: ParsedOptions;
    /**
     * Create a new Base with the provided name, schema and options
     * @param {string} name Name of the Base
     * @param {BaseOptions} opts Options object
    */
    constructor(name: string, schema: BaseSchema | Schema<SchemaType>, opts?: BaseOptions);
    /**
     * Create a new document with the provided data based on the Base schema
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    create(rawData: SchemaType): BaseDocument<SchemaType>;
    /**
     * Helper function to create and immediately save a new document
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    save(data: SchemaType): Promise<BaseDocument<SchemaType>>;
    _parseQuery(queryObj: Query<SchemaType>): any;
    /**
     * Wrapper around the Deta Base SDK fetch method
     *
     * Automatically gets all items until the limit or since the last item
     * @internal
    */
    _fetch(query?: any, limit?: number, last?: string): Promise<{
        items: any[];
        last?: string;
    }>;
    /**
     * Find all documents matching the query.
     *
     * Use limit and last to paginate the result.
     *
     * @param query A query object or array of query objects
     * @returns Array of Documents
    */
    find(query?: Query<SchemaType> | Query<SchemaType>[], limit?: number, last?: string): Promise<BaseDocument<SchemaType>[]>;
    /**
     * Find a single document matching the query.
     *
     * @param query A query object
     * @returns Document
    */
    findOne(query?: Query<SchemaType> | Query<SchemaType>[]): Promise<BaseDocument<SchemaType> | undefined>;
    /**
     * Find a single document by its key
     *
     * @param key The key of the document
     * @returns Document
    */
    findByKey(key: string): Promise<BaseDocument<SchemaType> | undefined>;
    /**
     * Find a single document matching the query and update it with the provided data.
     *
     * @param query A query object
     * @param data The data to update
     * @returns Document
    */
    findOneAndUpdate(query: Query<SchemaType> | Query<SchemaType>[] | undefined, data: Partial<SchemaType>): Promise<BaseDocument<SchemaType>>;
    /**
     * Find a single document by its key and update it with the provided data.
     *
     * @param key The key of the document
     * @param data The data to update
     * @returns Document
    */
    findByKeyAndUpdate(key: string, data: Partial<SchemaType>): Promise<BaseDocument<SchemaType>>;
    /**
     * Find a single document by its key and delete it.
     *
     * @param key The key of the document
    */
    findByKeyAndDelete(key: string): Promise<void>;
    /**
     * Find a single document matching the query and delete it.
     *
     * @param query A query object
    */
    findOneAndDelete(query?: Query<SchemaType> | Query<SchemaType>[]): Promise<void>;
}
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
declare class Document<SchemaType> {
    [k: string]: any;
    static _baseName: string;
    static _db: DetaBase;
    static _opts: ParsedOptions;
    _baseSchema?: Schema<SchemaType>;
    /**
     * Create a new Document instance with the provided data.
     *
     * Will auto generate a key if it is missing.
     * @internal
    */
    constructor(data: SchemaType, _baseSchema: Schema<SchemaType>);
    /**
     * Update the document with the provided data
     *
     * @param data The data to update
    */
    update(data: any): any;
    /**
     * Delete the document
    */
    delete(): Promise<void>;
    /**
     * Populate a sub-document
    */
    populate(path: string): Promise<any>;
    /**
     * Save the Document to the database
     *
     * @returns Document
    */
    save(): Promise<this>;
}
export {};
