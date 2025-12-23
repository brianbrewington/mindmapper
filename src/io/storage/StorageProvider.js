/**
 * Interface/Base class for storage providers.
 */
export class StorageProvider {
    /**
     * Saves content to the storage medium.
     * @param {string} fileName 
     * @param {string} content 
     * @param {string} contentType 
     * @returns {Promise<void>}
     */
    async save(fileName, content, contentType) {
        throw new Error('save() not implemented');
    }

    /**
     * Loads content from the storage medium.
     * @returns {Promise<string>} The file content
     */
    async load() {
        throw new Error('load() not implemented');
    }
}
