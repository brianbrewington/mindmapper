import { StorageProvider } from './StorageProvider.js';
import { driveClient } from '../DriveClient.js';

export class DriveStorageProvider extends StorageProvider {
    async save(fileName, content, contentType) {
        // DriveClient expects (fileName, content)
        // contentType might be handled widely, but DriveClient currently assumes JSON.
        // If we want to support other types, we might need to update DriveClient, 
        // but for now the abstraction separates the concern.
        return driveClient.saveFile(fileName, content);
    }

    async load() {
        return driveClient.loadFile();
    }
}
