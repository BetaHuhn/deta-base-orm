import { Low, Adapter } from 'lowdb';
import lodash from 'lodash';
declare class LowDash<T> extends Low<T> {
    chain?: lodash.CollectionChain<any> & lodash.FunctionChain<any> & lodash.ObjectChain<any> & lodash.PrimitiveChain<any> & lodash.StringChain;
    constructor(adapter: Adapter<T>);
}
/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
export declare class OfflineDB {
    db: LowDash<any>;
    _didLoad: boolean;
    constructor(storagePath?: string, fileName?: string);
    /**
     * Create a new instance of the OfflineDB with the file loaded automatically
     * @param storagePath The path where the JSON file
     * @param fileName The filename of the JSON file
     * @returns OfflineDB
     */
    static create(storagePath?: string, fileName?: string): Promise<OfflineDB>;
    /**
     * Initializes the database by loading the JSON file
     */
    init(): Promise<void>;
    /**
     * Checks if the database was loaded and if not initialize it
     */
    check(): Promise<void>;
    /**
     * Implements the put API
     * @param data The data to be inserted
     * @returns The inserted data
     */
    put(data: any): Promise<any>;
    /**
     * Lists all items in the database
     * @returns All items in the database
     */
    list(): Promise<any[] | undefined>;
    /**
     * Implements the get API
     * @param key The key of the item to be retrieved
     * @returns The item
     */
    get(key: string): Promise<any>;
    /**
     * Implements the fetch API
     *
     * Note: Limits/paging is not implemented yet, everything is returned
     * Note: Advanced query paramaters are also not yet supported
    */
    fetch(query: any, fetchOptions?: any): Promise<{
        items: any[];
        count: number;
        last: undefined;
    }>;
    /**
     * Implements the delete API
     * @param key The key of the item to be deleted
     * @returns null if the item was deleted
     */
    delete(key: string): Promise<null>;
    /**
     * Implements the update API
     * @param updates The updates to be applied
     * @param key The key of the item to be updated
     * @returns	The updated item
     */
    update(updates: any, key: string): Promise<null>;
}
export {};
