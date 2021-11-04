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
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
class LowDash extends Low {
    constructor(adapter) {
        super(adapter);
    }
}
export class OfflineDB {
    constructor(storagePath = '') {
        // const __dirname = dirname(fileURLToPath(import.meta.url))
        const file = join(storagePath, 'db.json');
        const adapter = new JSONFile(file);
        this.db = new LowDash(adapter);
    }
    static create(storagePath = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const db = new OfflineDB(storagePath);
            yield db.init();
            return db;
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.read();
            if (this.db.data === null) {
                this.db.data = [];
            }
            this.db.chain = lodash.chain(this.db.data);
        });
    }
    put(data) {
        this.db.data.push(data);
        this.db.write();
    }
    list() {
        var _a;
        return (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.value();
    }
    get(key) {
        var _a;
        return (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.find({ key }).value();
    }
    fetch(query) {
        var _a;
        return (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.find(query).value();
    }
    delete(key) {
        var _a;
        (_a = this.db.chain) === null || _a === void 0 ? void 0 : _a.remove({ key }).value();
        this.db.write();
    }
}
