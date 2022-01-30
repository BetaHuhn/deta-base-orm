import DetaBase from 'deta/dist/types/base';
import { Base as BaseClass } from './Base';
import { Schema as SchemaClass } from './Schema';
import { Document as DocumentClass } from './Document';
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
    /**
     * Enable offline mode
     *
     * It will use a local mock database instead of connecting to the remote Deta database
     * @default false
     */
    offline?: boolean;
    /**
     * The path to store the local mock Bases at
     *
     * File name will be basename.json
     * @default .deta-base-orm/
     */
    storagePath?: string;
}
export declare type DocumentData<BaseSchema> = BaseSchema & {
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
 * The data of a document
*/
export declare type BaseDocument<BaseSchema> = DocumentClass<BaseSchema> & DocumentData<BaseSchema>;
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
 * Add operators to each property of a BaseSchema
*/
export declare type SchemaWithOperators<SchemaType> = {
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
export interface ParsedOptions {
    ascending: boolean;
    timestamp: boolean;
    offline: boolean;
    storagePath: string;
}
export declare enum SchemaPropertyType {
    Base = "base",
    String = "string",
    Number = "number",
    Boolean = "boolean",
    Array = "array",
    Object = "object"
}
export declare type BaseValueType = string | number | boolean | object | BaseValueType[];
export declare type SchemaParam = {
    [key: string]: string | number | boolean | SchemaParam | SchemaParam[];
};
export interface SchemaOptions {
    type: string;
    required?: boolean;
    default?: BaseValueType;
    base?: BaseClass<SchemaParam>;
    baseName?: string;
    baseSchema?: SchemaClass<SchemaParam>;
}
export declare type BaseSchema = {
    [key: string]: string | BaseClass<SchemaParam> | SchemaOptions | BaseSchema;
};
export declare type RecursiveSchema<T> = {
    [K in keyof T]?: T[K] extends object | undefined ? RecursiveSchema<T[K]> : T | SchemaOptions;
};
/**
 * The full schema of a document
*/
export declare type FullSchema<SchemaType> = SchemaType & {
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
};
export interface ParsedSchemaOptions {
    type: string;
    required: boolean;
    __end: boolean;
    default?: BaseValueType;
    base?: BaseClass<BaseSchema>;
    baseName?: string;
    baseSchema?: SchemaClass<BaseSchema>;
}
export interface ParsedBaseSchema {
    [key: string]: ParsedSchemaOptions;
}
