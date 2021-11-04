import DetaBase from 'deta/dist/types/base';
import { OfflineDB } from './Offline';
import { ParsedOptions, BaseSchema, BaseOptions, BaseDocument, Query, FullSchema } from './types';
import { Schema } from './Schema';
/**
 * Create and interact with a Deta Base
*/
export declare class Base<SchemaType> {
    _baseName: string;
    _baseSchema: Schema<SchemaType>;
    _db: DetaBase | OfflineDB;
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
    create(rawData: FullSchema<SchemaType>): BaseDocument<SchemaType>;
    /**
     * Helper function to create and immediately save a new document
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    save(data: FullSchema<SchemaType>): Promise<BaseDocument<SchemaType>>;
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
     * @param limit Maximum number of items to return
     * @param last The key of the last item to start from
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
