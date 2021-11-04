var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable valid-jsdoc */
import { Deta } from 'deta';
import { generateKey } from './random';
/**
 * Represents a Document with all of its data and methods
 * @internal
*/
export class Document {
    /**
     * Create a new Document instance with the provided data.
     *
     * Will auto generate a key if it is missing.
     * @internal
    */
    constructor(data, _baseSchema) {
        Object.assign(this, data);
        this.key = this.key || generateKey(Document._opts.ascending);
        // Add timestamp to document
        if (Document._opts.timestamp && this.createdAt === undefined) {
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
            const deta = Deta();
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
