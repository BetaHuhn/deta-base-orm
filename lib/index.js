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
exports.Document = exports.Base = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const deta_1 = require("deta");
const dotenv_1 = __importDefault(require("dotenv"));
const random_1 = require("./random");
dotenv_1.default.config();
class Base {
    constructor(name, db) {
        this._baseName = name;
        if (db !== undefined) {
            this._db = db;
            return;
        }
        const deta = deta_1.Deta();
        this._db = deta.Base(name);
    }
    create(data) {
        Document._baseName = this._baseName;
        Document._db = this._db;
        return Document.create(data);
    }
    save(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = this.create(data);
            yield doc.save();
            return doc;
        });
    }
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
    findOne(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this._db.fetch(query, { limit: 1 });
            if (res.count < 1)
                return undefined;
            return this.create(res.items[0]);
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ id });
        });
    }
    findOneAndUpdate(query, data) {
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
    findByIdAndUpdate(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findById(id);
            if (!item)
                throw new Error('No item with that id exists');
            // Prevent accidently changing immutable attributes
            const newItem = Object.assign(Object.assign({}, data), { key: undefined });
            yield this._db.update(newItem, item.key);
            return item;
        });
    }
    findByIdAndDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findById(id);
            if (!item)
                throw new Error('No item with that id exists');
            yield this._db.delete(item.key);
            return true;
        });
    }
    findOneAndDelete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.findOne(query);
            if (!item)
                throw new Error('No item with that id exists');
            yield this._db.delete(item.key);
            return true;
        });
    }
}
exports.Base = Base;
class Document {
    constructor(data) {
        Object.assign(this, data);
        this.id = this.id || random_1.generateId();
        this.key = this.key || random_1.generateKey(false);
        this.addedAt = this.addedAt || new Date();
    }
    update(changes) {
        return changes;
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Document._db.delete(this.key);
            return true;
        });
    }
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
    static create(data) {
        return new Document(data);
    }
}
exports.Document = Document;
