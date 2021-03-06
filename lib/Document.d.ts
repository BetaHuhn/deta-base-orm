import DetaBase from 'deta/dist/types/base';
import { OfflineDB } from './Offline';
import { ParsedOptions, DocumentData } from './types';
import { Schema } from './Schema';
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
export declare class Document<SchemaType> {
    [k: string]: any;
    _baseName: string;
    _db: DetaBase | OfflineDB;
    _opts: ParsedOptions;
    _baseSchema: Schema<SchemaType>;
    _data: DocumentData<SchemaType>;
    /**
     * Create a new Document instance with the provided data.
     *
     * Will auto generate a key if it is missing.
     * @internal
    */
    constructor(data: SchemaType, _baseSchema: Schema<SchemaType>, _baseName: string, _db: DetaBase | OfflineDB, _opts: ParsedOptions);
    /**
     * Update the document with the provided data
     *
     * @param data The data to update
    */
    update(data: any): Promise<any>;
    /**
     * Delete the document
    */
    delete(): Promise<void>;
    /**
     * Populate a sub-document
     *
     * Note: Very hacky and unstable at the moment
    */
    populate(path: string): Promise<any>;
    /**
     * Save the Document to the database
     *
     * @returns Document
    */
    save(): Promise<this>;
    /**
     * Returns only the data of the document
     *
     * @returns Data of the document
    */
    value(): DocumentData<SchemaType>;
}
