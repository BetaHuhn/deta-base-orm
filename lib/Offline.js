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
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { join } from 'path';
import fs from 'fs';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
class LowDash extends Low {
    constructor(adapter) {
        super(adapter);
    }
}
/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
export class OfflineDB {
    constructor(storagePath = '.deta-base-orm', fileName = 'base') {
        const folderExists = fs.existsSync(storagePath);
        if (!folderExists) {
            if (storagePath !== '.deta-base-orm') {
                throw new Error(`The folder "${storagePath}" does not exist, please create it manually`);
            }
            fs.mkdirSync(storagePath);
        }
        const file = join(storagePath, `${fileName}.json`);
        const adapter = new JSONFile(file);
        this.db = new LowDash(adapter);
        this._didLoad = false;
    }
    /**
     * Create a new instance of the OfflineDB with the file loaded automatically
     * @param storagePath The path where the JSON file
     * @param fileName The filename of the JSON file
     * @returns OfflineDB
     */
    static create(storagePath, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = new OfflineDB(storagePath, fileName);
            yield db.init();
            return db;
        });
    }
    /**
     * Initializes the database by loading the JSON file
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.read();
            if (this.db.data === null) {
                this.db.data = [];
            }
            this.db.chain = lodash.chain(this.db.data);
            this._didLoad = true;
        });
    }
    /**
     * Checks if the database was loaded and if not initialize it
     */
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._didLoad) {
                yield this.init();
            }
        });
    }
    /**
     * Implements the put API
     * @param data The data to be inserted
     * @returns The inserted data
     */
    put(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            this.db.data.push(data);
            yield this.db.write();
            return data;
        });
    }
    /**
     * Lists all items in the database
     * @returns All items in the database
     */
    list() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            return (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.value();
        });
    }
    /**
     * Implements the get API
     * @param key The key of the item to be retrieved
     * @returns The item
     */
    get(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            return ((_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.find({ key }).value()) || null;
        });
    }
    /**
     * Implements the fetch API
     *
     * Note: Limits/paging is not implemented yet, everything is returned
     * Note: Advanced query paramaters are also not yet supported
    */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    fetch(query, fetchOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            let results = [];
            query.forEach((query) => {
                var _a;
                const items = (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.filter(query).value();
                results = lodash.unionBy(results, items, 'key');
            });
            if (!results) {
                return { items: [], count: 0, last: undefined };
            }
            // Limiting is not yet implemented, so everything is returned and last is set to undefined
            return { items: results, count: results.length, last: undefined };
        });
    }
    /**
     * Implements the delete API
     * @param key The key of the item to be deleted
     * @returns null if the item was deleted
     */
    delete(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.remove({ key }).value();
            yield this.db.write();
            return null;
        });
    }
    /**
     * Implements the update API
     * @param updates The updates to be applied
     * @param key The key of the item to be updated
     * @returns	The updated item
     */
    update(updates, key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.update(key, updates).value();
            yield this.db.write();
            return null;
        });
    }
}
