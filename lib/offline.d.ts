import { Low, Adapter } from 'lowdb';
import lodash from 'lodash';
declare class LowDash<T> extends Low<T> {
    chain?: lodash.CollectionChain<any> & lodash.FunctionChain<any> & lodash.ObjectChain<any> & lodash.PrimitiveChain<any> & lodash.StringChain;
    constructor(adapter: Adapter<T>);
}
export declare class OfflineDB {
    db: LowDash<any>;
    constructor(storagePath?: string);
    static create(storagePath?: string): Promise<OfflineDB>;
    init(): Promise<void>;
    put(data: any): void;
    list(): any[] | undefined;
    get(key: string): any;
    fetch(query: any): any;
    delete(key: string): void;
}
export {};
