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
exports.OfflineDB = void 0;
/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const lowdb_1 = __importDefault(require("lowdb"));
const FileAsync_1 = __importDefault(require("lowdb/adapters/FileAsync"));
const lodash_1 = require("lodash");
/**
 * Mocks the Deta Base SDK with a local database
 *
 * It uses a local JSON file for each Base.
 *
 * Note: Not all methods are implemented, only the ones need by deta-base-orm
 */
class OfflineDB {
    constructor(storagePath = '.deta-base-orm', fileName = 'base') {
        const folderExists = fs_1.default.existsSync(storagePath);
        if (!folderExists) {
            if (storagePath !== '.deta-base-orm') {
                throw new Error(`The folder "${storagePath}" does not exist, please create it manually`);
            }
            fs_1.default.mkdirSync(storagePath);
        }
        const file = path_1.join(storagePath, `${fileName}.json`);
        this._baseName = fileName;
        this._filePath = file;
        this._adapter = new FileAsync_1.default(file);
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
            this._db = yield lowdb_1.default(this._adapter);
            yield this._db.read();
            if (this._db.get(this._baseName).value() === undefined) {
                yield this._db.set(this._baseName, []).write();
            }
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.check();
            yield ((_a = this._db) === null || _a === void 0 ? void 0 : _a.get(this._baseName).push(data).write());
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
            return (_a = this._db) === null || _a === void 0 ? void 0 : _a.value();
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
            return ((_a = this._db) === null || _a === void 0 ? void 0 : _a.get(this._baseName).find({ key }).value()) || null;
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
                const items = (_a = this._db) === null || _a === void 0 ? void 0 : _a.get(this._baseName).filter(query).value();
                results = lodash_1.unionBy(results, items, 'key');
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
            yield ((_a = this._db) === null || _a === void 0 ? void 0 : _a.get(this._baseName).remove({ key }).write());
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
            yield ((_a = this._db) === null || _a === void 0 ? void 0 : _a.get(this._baseName).update(key, updates).write());
            return null;
        });
    }
}
exports.OfflineDB = OfflineDB;
