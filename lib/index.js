"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
/* eslint-disable valid-jsdoc */
const deta_1 = require("deta");
const dotenv_1 = __importDefault(require("dotenv"));
const random_1 = require("./random");
dotenv_1.default.config();
/**
 * Create and interact with a Deta Base
*/
class Base {
    /**
     * Create a new Base with the provided name, schema and options
     * @param {string} name Name of the Base
     * @param {BaseOptions} opts Options object
    */
    constructor(name, opts) {
        this._baseName = name;
        // Parse options
        const ascending = (opts === null || opts === void 0 ? void 0 : opts.descending) !== true;
        const timestamp = (opts === null || opts === void 0 ? void 0 : opts.timestamp) || false;
        this._opts = { ascending, timestamp };
        // Reuse Deta Base
        const db = opts === null || opts === void 0 ? void 0 : opts.db;
        if (db !== undefined) {
            this._db = db;
            return;
        }
        // Create new Deta Base instance
        const deta = deta_1.Deta();
        this._db = deta.Base(name);
    }
    /**
     * Create a new document with the provided data based on the Base schema
     * @param {Schema} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    create(data) {
        // Set configs
        Document._baseName = this._baseName;
        Document._db = this._db;
        Document._opts = this._opts;
        // Create new document with data
        return Document.create(data);
    }
    /**
     * Helper function to create and immediately save a new document
     * @param {Schema} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    save(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = this.create(data);
            yield doc.save();
            return doc;
        });
    }
    /**
     * Wrapper around the Deta Base SDK fetch method
     *
     * Automatically gets all items until the limit or since the last item
     * @internal
    */
    _fetch(query = {}, limit, last) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this._db.fetch(query, limit ? { limit, last } : undefined);
            let items = res.items;
            // We already have enough data
            if (limit && items.length === limit)
                return items;
            // More data available
            while (res.last) {
                res = yield this._db.fetch(query, Object.assign(Object.assign({}, (limit) && { limit: limit - items.length }), { 
                    // Since the last item
                    last: res.last }));
                items = items.concat(items);
            }
            // We have everything
            return items;
        });
    }
    /**
     * Find all documents matching the query.
     *
     * Use limit and last to paginate the result.
     *
     * @param query A query object
     * @returns Array of Documents
    */
    find(query = {}, limit, last) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = yield this._fetch(query, limit, last);
            if (!items)
                return [];
            const res = items.map((item) => {
                return this.create(item);
            });
            return res;
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
            const res = yield this._db.fetch(query, { limit: 1 });
            if (res.count < 1)
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
            return this.findOne({ key });
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
                throw new Error('No item with that id exists');
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
                throw new Error('No item with that id exists');
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
                throw new Error('No item with that id exists');
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
                throw new Error('No item with that id exists');
            yield this._db.delete(item.key);
        });
    }
}
exports.Base = Base;
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
class Document {
    /**
     * Create a new Document instance with the provided data.
     *
     * Will auto generate a key if it is missing.
     * @internal
    */
    constructor(data) {
        Object.assign(this, data);
        this.key = this.key || random_1.generateKey(Document._opts.ascending);
        // Add timestamp to document
        if (Document._opts.timestamp) {
            this.createdAt = Date.now();
        }
    }
    /**
     * Update the document with the provided data
     *
     * @param data The data to update
    */
    update(data) {
        return data;
    }
    /**
     * Delete the document
    */
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Document._db.delete(this.key);
        });
    }
    /**
     * Save the Document to the database
     *
     * @returns Document
    */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            const toBeCreated = Object.assign({}, this);
            // Use put and not insert as we can assume our random key doesn't exist
            const newItem = yield Document._db.put(toBeCreated);
            if (!newItem)
                throw new Error('Could not create item');
            return this;
        });
    }
    /**
     * Create a new Document
     *
     * Is used instead of the contructor in order to return the data with a different type, ref: https://git.io/JR2Yc
     * @internal
    */
    static create(data) {
        return new Document(data);
    }
}
