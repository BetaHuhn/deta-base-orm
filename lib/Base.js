var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable valid-jsdoc */
import { Deta } from 'deta';
import { generateKey } from './random';
import { OfflineDB } from './Offline';
import { Schema } from './Schema';
import { Document } from './Document';
/**
 * Create and interact with a Deta Base
*/
export class Base {
    /**
     * Create a new Base with the provided name, schema and options
     * @param {string} name Name of the Base
     * @param {BaseOptions} opts Options object
    */
    constructor(name, schema, opts) {
        this._baseName = name;
        if (schema instanceof Schema) {
            this._baseSchema = schema;
        }
        else {
            this._baseSchema = new Schema(schema);
        }
        // Parse options
        const ascending = (opts === null || opts === void 0 ? void 0 : opts.descending) !== true;
        const timestamp = (opts === null || opts === void 0 ? void 0 : opts.timestamp) || false;
        const offline = (opts === null || opts === void 0 ? void 0 : opts.offline) || false;
        const storagePath = (opts === null || opts === void 0 ? void 0 : opts.storagePath) || '.deta-base-orm';
        this._opts = { ascending, timestamp, offline, storagePath };
        if (this._opts.offline) {
            this._db = new OfflineDB(this._opts.storagePath, this._baseName);
            return;
        }
        // Reuse Deta Base
        const db = opts === null || opts === void 0 ? void 0 : opts.db;
        if (db !== undefined) {
            this._db = db;
            return;
        }
        // Create new Deta Base instance
        const deta = Deta();
        this._db = deta.Base(name);
    }
    /**
     * Create a new document with the provided data based on the Base schema
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    create(rawData) {
        // Set configs
        Document._baseName = this._baseName;
        Document._db = this._db;
        Document._opts = this._opts;
        // Auto generate a key if is missing
        if (!rawData.key) {
            rawData.key = generateKey(this._opts.ascending);
        }
        // Add timestamp to document
        if (this._opts.timestamp && rawData.createdAt === undefined) {
            rawData.createdAt = Date.now();
        }
        const validated = this._baseSchema.validate(rawData);
        // Log all errors and throw first one
        if (validated.errors && validated.errors.length > 0) {
            validated.errors.forEach((err) => console.error('Validation error: ' + err));
            throw new Error(validated.errors[0]);
        }
        const data = validated.result;
        // Create new document with data
        return new Document(data, this._baseSchema);
    }
    /**
     * Helper function to create and immediately save a new document
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    save(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = this.create(data);
            yield doc.save();
            return doc;
        });
    }
    _parseQuery(queryObj) {
        const queries = Object.entries(queryObj);
        const result = {};
        queries.forEach(([key, query]) => {
            if (typeof query !== 'object' || query === null) {
                return result[key] = query;
            }
            const properties = Object.entries(query);
            properties.forEach(([operator, value]) => {
                if (!operator.startsWith('$'))
                    return;
                if (operator === '$con') {
                    result[`${key}?contains`] = value;
                }
                else if (operator === '$ncon') {
                    result[`${key}?!contains`] = value;
                }
                else if (operator === '$rg') {
                    result[`${key}?r`] = value;
                }
                else if (operator === '$eq') {
                    result[key] = value;
                }
                else {
                    result[`${key}?${operator.slice(1)}`] = value;
                }
            });
        });
        return result;
    }
    /**
     * Wrapper around the Deta Base SDK fetch method
     *
     * Automatically gets all items until the limit or since the last item
     * @internal
    */
    _fetch(query = {}, limit, last) {
        return __awaiter(this, void 0, void 0, function* () {
            const queries = Array.isArray(query) ? query : [query];
            const parsedQuery = queries.map(this._parseQuery);
            let res = yield this._db.fetch(parsedQuery, limit ? { limit, last } : undefined);
            let items = res.items;
            // We already have enough data
            if (limit && items.length === limit)
                return { items, last: res.last };
            // More data available
            while (res.last) {
                res = yield this._db.fetch(parsedQuery, Object.assign(Object.assign({}, (limit) && { limit: limit - items.length }), { 
                    // Since the last item
                    last: res.last }));
                items = items.concat(items);
            }
            // We have everything
            return { items };
        });
    }
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
    find(query = {}, limit, last) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this._fetch(query, limit, last);
            if (!res.items)
                return [];
            const result = res.items.map((item) => {
                return this.create(item);
            });
            return result;
        });
    }
    /**
     * Find a single document matching the query.
     *
     * @param query A query object
     * @returns Document
    */
    findOne(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this._fetch(query, 1);
            if (res.items.length < 1)
                return undefined;
            return this.create(res.items[0]);
        });
    }
    /**
     * Find a single document by its key
     *
     * @param key The key of the document
     * @returns Document
    */
    findByKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this._db.get(key);
            if (!res)
                return undefined;
            return this.create(res);
        });
    }
    /**
     * Find a single document matching the query and update it with the provided data.
     *
     * @param query A query object
     * @param data The data to update
     * @returns Document
    */
    findOneAndUpdate(query = {}, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findOne(query);
            if (item === undefined)
                throw new Error('No item with that key exists');
            // Prevent accidently changing immutable attributes
            const newItem = Object.assign(Object.assign({}, data), { key: undefined });
            yield this._db.update(newItem, item.key);
            return item;
        });
    }
    /**
     * Find a single document by its key and update it with the provided data.
     *
     * @param key The key of the document
     * @param data The data to update
     * @returns Document
    */
    findByKeyAndUpdate(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findByKey(key);
            if (!item)
                throw new Error('No item with that key exists');
            // Prevent accidently changing immutable attributes
            const newItem = Object.assign(Object.assign({}, data), { key: undefined });
            yield this._db.update(newItem, item.key);
            return item;
        });
    }
    /**
     * Find a single document by its key and delete it.
     *
     * @param key The key of the document
    */
    findByKeyAndDelete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findByKey(key);
            if (!item)
                throw new Error('No item with that key exists');
            yield this._db.delete(item.key);
        });
    }
    /**
     * Find a single document matching the query and delete it.
     *
     * @param query A query object
    */
    findOneAndDelete(query = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findOne(query);
            if (!item)
                throw new Error('No item with that key exists');
            yield this._db.delete(item.key);
        });
    }
}
