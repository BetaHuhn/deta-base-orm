import DetaBase from 'deta/dist/types/base';
import { OfflineDB } from './Offline';
import { ParsedOptions } from './types';
import { Schema } from './Schema';
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
export declare class Document<SchemaType> {
    [k: string]: any;
    static _baseName: string;
    static _db: DetaBase | OfflineDB;
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
