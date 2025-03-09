import { DBSchema } from 'idb';
import { Resource, LocalNote } from './types';
interface AudioLearningDBSchema extends DBSchema {
    resources: {
        key: string;
        value: Resource;
        indexes: {
            'by-category': string;
            'by-difficulty': string;
        };
    };
    notes: {
        key: string;
        value: LocalNote;
        indexes: {
            'by-resource': string;
        };
    };
    progress: {
        key: string;
        value: {
            resourceId: string;
            completed: boolean;
            lastAccessed: number;
        };
        indexes: {
            'by-resource': string;
        };
    };
}
export declare const initDB: () => Promise<import("idb").IDBPDatabase<AudioLearningDBSchema>>;
export {};
