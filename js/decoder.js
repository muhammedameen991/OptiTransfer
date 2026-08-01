import { utils } from './utils.js';
import { fileManager } from './fileManager.js';

/**
 * Handles the state of incoming frames and reconstructs the file.
 */
export class Decoder {
    constructor() {
        this.reset();
        this.onProgress = null;
        this.onComplete = null;
    }

    reset() {
        this.metadata = null;
        this.chunksMap = new Map(); // Store received chunks by index
        this.totalExpected = 0;
        this.isComplete = false;
    }

    processFrame(dataString) {
        if (this.isComplete) return;

        const parts = dataString.split('|');
        const type = parts[0];

        if (type === 'H' && !this.metadata) {
            // H|filename|mime|size|totalChunks
            this.metadata = {
                name: parts[1],
                mime: parts[2],
                size: parseInt(parts[3]),
                totalChunks: parseInt(parts[4])
            };
            this.totalExpected = this.metadata.totalChunks;
            this.updateProgress();
        } 
        else if (type === 'D' && this.metadata) {
            // D|index|total|base64data
            const index = parseInt(parts[1]);
            const b64 = parts[3];

            if (!this.chunksMap.has(index)) {
                this.chunksMap.set(index, utils.base64ToUint8Array(b64));
                this.updateProgress();
                this.checkCompletion();
            }
        }
    }

    updateProgress() {
        if (this.onProgress && this.metadata) {
            this.onProgress(this.chunksMap.size, this.totalExpected);
        }
    }

    checkCompletion() {
        if (this.metadata && this.chunksMap.size === this.totalExpected) {
            this.isComplete = true;
            fileManager.reconstructFile(this.metadata, this.chunksMap);
            if (this.onComplete) this.onComplete();
        }
    }
}
