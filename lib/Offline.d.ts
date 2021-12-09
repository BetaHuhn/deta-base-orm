/// <reference types="@types/lowdb" />
import low from 'lowdb';
interface DbSchema {
    [k: string]: [any];
}
/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
export declare class OfflineDB {
    _db?: low.LowdbAsync<DbSchema>;
    _adapter: any;
    _didLoad: boolean;
    _filePath: string;
    _baseName: string;
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
    list(): Promise<DbSchema | undefined>;
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
