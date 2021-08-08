import DetaBase from 'deta/dist/types/base';
export declare type DocumentResponse<Schema> = Document<Schema> & Schema & {
    /** The ascending key of the document */
    key: string;
    /**  The unique id of the document */
    id: string;
    /** The date when the document was created */
    addedAt: string;
};
export declare class Base<Schema> {
    _baseName: string;
    _db: DetaBase;
    constructor(name: string, db?: DetaBase);
    create(data: Schema): DocumentResponse<Schema>;
    save(data: Schema): Promise<DocumentResponse<Schema>>;
    _fetch(query?: any, limit?: number, last?: string): Promise<any[]>;
    find(query?: any, limit?: number, last?: string): Promise<DocumentResponse<Schema>[]>;
    findOne(query: any): Promise<DocumentResponse<Schema> | undefined>;
    findById(id: string): Promise<DocumentResponse<Schema> | undefined>;
    findOneAndUpdate(query: any, data: any): Promise<DocumentResponse<Schema>>;
    findByIdAndUpdate(id: string, data: any): Promise<DocumentResponse<Schema>>;
    findByIdAndDelete(id: string): Promise<boolean>;
    findOneAndDelete(query: any): Promise<boolean>;
}
export declare class Document<Schema> {
    [k: string]: any;
    static _baseName: string;
    static _db: DetaBase;
    constructor(data: Schema);
    update(changes: any): any;
    delete(): Promise<boolean>;
    save(): Promise<this>;
    static create<Schema>(data: any): DocumentResponse<Schema>;
}
