import DetaBase from 'deta/dist/types/base';
export interface BaseOptions {
    /** Existing Deta Base instance */
    db?: DetaBase;
    /** Generate keys in descending order i.e. newest on top */
    descending?: boolean;
    /** Automatically create createdAt field containing the timestamp */
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
 * Query to use for finding documents
*/
export declare type Query<Schema> = Partial<Schema | {
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
}>;
interface ParsedOptions {
    ascending: boolean;
    timestamp: boolean;
}
/**
 * Create and interact with a Deta Base
*/
export declare class Base<Schema> {
    _baseName: string;
    _db: DetaBase;
    _opts: ParsedOptions;
    /**
     * Create a new Base with the provided name, schema and options
     * @param {string} name Name of the Base
     * @param {BaseOptions} opts Options object
    */
    constructor(name: string, opts?: BaseOptions);
    /**
     * Create a new document with the provided data based on the Base schema
     * @param {Schema} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    create(data: Schema): BaseDocument<Schema>;
    /**
     * Helper function to create and immediately save a new document
     * @param {Schema} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    save(data: Schema): Promise<BaseDocument<Schema>>;
    /**
     * Wrapper around the Deta Base SDK fetch method
     *
     * Automatically gets all items until the limit or since the last item
     * @internal
    */
    _fetch(query?: any, limit?: number, last?: string): Promise<any[]>;
    /**
     * Find all documents matching the query.
     *
     * Use limit and last to paginate the result.
     *
     * @param query A query object
     * @returns Array of Documents
    */
    find(query?: Query<Schema>, limit?: number, last?: string): Promise<BaseDocument<Schema>[]>;
    /**
     * Find a single document matching the query.
     *
     * @param query A query object
     * @returns Document
    */
    findOne(query?: Query<Schema>): Promise<BaseDocument<Schema> | undefined>;
    /**
     * Find a single document by its key
     *
     * @param key The key of the document
     * @returns Document
    */
    findByKey(key: string): Promise<BaseDocument<Schema> | undefined>;
    /**
     * Find a single document matching the query and update it with the provided data.
     *
     * @param query A query object
     * @param data The data to update
     * @returns Document
    */
    findOneAndUpdate(query: Query<Schema> | undefined, data: Partial<Schema>): Promise<BaseDocument<Schema>>;
    /**
     * Find a single document by its key and update it with the provided data.
     *
     * @param key The key of the document
     * @param data The data to update
     * @returns Document
    */
    findByKeyAndUpdate(key: string, data: Partial<Schema>): Promise<BaseDocument<Schema>>;
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
    findOneAndDelete(query?: Query<Schema>): Promise<void>;
}
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
declare class Document<Schema> {
    [k: string]: any;
    static _baseName: string;
    static _db: DetaBase;
    static _opts: ParsedOptions;
    /**
     * Create a new Document instance with the provided data.
     *
     * Will auto generate a key if it is missing.
     * @internal
    */
    constructor(data: Schema);
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
     * Save the Document to the database
     *
     * @returns Document
    */
    save(): Promise<this>;
    /**
     * Create a new Document
     *
     * Is used instead of the contructor in order to return the data with a different type, ref: https://git.io/JR2Yc
     * @internal
    */
    static create<Schema>(data: any): BaseDocument<Schema>;
}
export {};
