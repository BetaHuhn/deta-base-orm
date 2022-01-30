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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable valid-jsdoc */
const deta_1 = require("deta");
const random_1 = require("./random");
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
    constructor(data, _baseSchema, _baseName, _db, _opts) {
        this._baseName = _baseName;
        this._db = _db;
        this._opts = _opts;
        // Store data
        const documentData = Object.assign(Object.assign(Object.assign({}, data), { 
            // Generate new key if it doesn't exist
            key: data.key || random_1.generateKey(_opts.ascending) }), (_opts.timestamp || data.createdAt && { createdAt: data.createdAt || Date.now() }));
        // Use defineProperty to hide the property from the Class using enumerable: false
        Object.defineProperty(this, '_data', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: documentData
        });
        // Make data directly accessible (e.g. Document.key)
        // Todo: Would probably be better to use getters and setters
        Object.assign(this, this._data);
        // Use defineProperty to hide the property from the Class using enumerable: false
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
        return __awaiter(this, void 0, void 0, function* () {
            // Prevent key from being overwritten
            delete data.key;
            console.log(this.key);
            yield this._db.update(data, this.key);
            const newData = yield this._db.get(this.key);
            this._data = newData;
            Object.assign(this, newData);
            return newData;
        });
    }
    /**
     * Delete the document
    */
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._db.delete(this.key);
        });
    }
    /**
     * Populate a sub-document
     *
     * Note: Very hacky and unstable at the moment
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
                this._data[path] = validated.result;
            }
            else {
                this[path] = rawData;
                this._data[path] = rawData;
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
            const toBeCreated = this._data;
            // Use put and not insert as we can assume our random key doesn't exist
            const newItem = yield this._db.put(toBeCreated);
            if (!newItem)
                throw new Error('Could not create item');
            return this;
        });
    }
    /**
     * Returns only the data of the document
     *
     * @returns Data of the document
    */
    value() {
        return this._data;
    }
}
exports.Document = Document;
