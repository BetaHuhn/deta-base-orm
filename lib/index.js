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
exports.Base = exports.Schema = void 0;
/* eslint-disable valid-jsdoc */
const deta_1 = require("deta");
const dotenv_1 = __importDefault(require("dotenv"));
const random_1 = require("./random");
dotenv_1.default.config();
/**
 * Create a schema for your Base
*/
class Schema {
    constructor(schema) {
        this.schema = this.parse(schema);
    }
    parse(schema) {
        const parsedSchema = {};
        const validTypes = ['string', 'number', 'boolean', 'array', 'object', 'base'];
        Object.entries(schema).forEach(([key, value]) => {
            // Parse type shorthand notation
            if (typeof value === 'string') {
                parsedSchema[key] = {
                    __end: true,
                    type: value,
                    required: true,
                    default: undefined
                };
                // Parse Base shorthand notation
            }
            else if (value instanceof Base) {
                parsedSchema[key] = {
                    __end: true,
                    type: 'base',
                    baseName: value._baseName,
                    baseSchema: value._baseSchema,
                    required: true,
                    default: undefined
                };
                // Recursivly parse none schema object
            }
            else if (typeof value === 'object' && (!value.type || typeof value.type !== 'string')) {
                parsedSchema[key] = this.parse(value);
                // Parse schema object
            }
            else {
                parsedSchema[key] = {
                    __end: true,
                    type: value.type || 'string',
                    required: value.required !== undefined ? value.required : value.default === undefined,
                    default: value.default !== undefined ? value.default : undefined
                };
                if (value.type === 'base') {
                    if (value.base) {
                        parsedSchema[key].baseName = value.base._baseName;
                        parsedSchema[key].baseSchema = value.base._baseSchema;
                    }
                    else {
                        parsedSchema[key].baseName = value.baseName !== undefined ? value.baseName : undefined;
                        parsedSchema[key].baseSchema = value.baseSchema !== undefined ? value.baseSchema : undefined;
                    }
                }
            }
            // Verify that types are valid
            if (typeof parsedSchema[key].type === 'string' && !validTypes.includes(parsedSchema[key].type)) {
                throw new Error(`Invalid type "${parsedSchema[key].type}"`);
            }
        });
        return parsedSchema;
    }
    validate(data, partialSchema) {
        let errors = [];
        let result = {};
        const schema = partialSchema || this.schema;
        // Helper function to set keys without overwriting whole object
        const setRes = (key, value) => {
            result = Object.assign(Object.assign({}, result), { [key]: value });
        };
        // Helper function to check JS types
        const checkType = (type, value) => {
            if (type === 'string') {
                return typeof value === 'string';
            }
            else if (type === 'number') {
                return typeof value === 'number';
            }
            else if (type === 'boolean') {
                return typeof value === 'boolean';
            }
            else if (type === 'array') {
                return Array.isArray(value);
            }
            else if (type === 'object') {
                return typeof value === 'object';
            }
            else if (type === 'base') {
                return typeof value === 'string';
            }
        };
        Object.entries(schema).forEach(([key, value]) => {
            // If the value is not a schema object, we need to validate it recursivly
            if (typeof value === 'object' && value.__end === undefined) {
                const obj = this.validate(data[key], value);
                errors = errors.concat(obj.errors);
                setRes(key, obj.result);
                // Check if the value is required and is present
            }
            else if (value.required && data[key] === undefined) {
                errors.push(`Missing required field "${key}"`);
                // If no value use default value if present
            }
            else if (data === undefined || data[key] === undefined) {
                if (schema[key].default !== undefined) {
                    setRes(key, schema[key].default);
                }
                // If the value is present, validate its type
            }
            else if (!checkType(value.type, data[key])) {
                errors.push(`Invalid type for "${key}": expected "${value.type}", got "${typeof data[key]}"`);
                // Use the actual value
            }
            else {
                setRes(key, data[key]);
            }
        });
        return { errors, result: result };
    }
}
exports.Schema = Schema;
/**
 * Create and interact with a Deta Base
*/
class Base {
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
     * @param {SchemaType} data Object representing the data of the new document
     * @returns {BaseDocument} Document
     */
    create(rawData) {
        // Set configs
        Document._baseName = this._baseName;
        Document._db = this._db;
        Document._opts = this._opts;
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
    constructor(data, _baseSchema) {
        Object.assign(this, data);
        this.key = this.key || random_1.generateKey(Document._opts.ascending);
        // Add timestamp to document
        if (Document._opts.timestamp) {
            this.createdAt = Date.now();
        }
        Object.defineProperty(this, '_baseSchema', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: _baseSchema
        });
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
     * Populate a sub-document
    */
    populate(path) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const pathObj = (_a = this._baseSchema) === null || _a === void 0 ? void 0 : _a.schema[path];
            if (!pathObj)
                throw new Error(`No path with that name found to populate`);
            const baseName = pathObj === null || pathObj === void 0 ? void 0 : pathObj.baseName;
            if (!baseName)
                throw new Error(`Can't populate this path because it doesn't have a baseName defined`);
            // Create new Deta Base instance
            const deta = deta_1.Deta();
            const db = deta.Base(baseName);
            const key = this[path];
            const rawData = yield db.get(key);
            if (rawData === null)
                throw new Error(`No item with that key exists in the base ${baseName}`);
            const schemaOfPath = pathObj.baseSchema;
            if (schemaOfPath) {
                const validated = schemaOfPath.validate(rawData);
                // Log all errors and throw first one
                if (validated.errors && validated.errors.length > 0) {
                    validated.errors.forEach((err) => console.error('Validation error: ' + err));
                    throw new Error(validated.errors[0]);
                }
                this[path] = validated.result;
            }
            else {
                this[path] = rawData;
            }
            // Todo: Make resolved Document typed based on referenced Base
            return this[path];
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
}
