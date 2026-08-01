import { utils } from './utils.js';

/**
 * Handles file reading, chunking, and reconstruction.
 */
export const fileManager = {
    CHUNK_SIZE: 512, // Bytes per QR code (optimized for QR density vs camera resolution)

    async processFileForSending(file) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const totalChunks = Math.ceil(uint8.length / this.CHUNK_SIZE);
        const chunks = [];

        // Metadata Header Frame (Index -1 to indicate header)
        // Format: H|filename|mime|size|totalChunks
        const header = `H|${file.name}|${file.type || 'application/octet-stream'}|${file.size}|${totalChunks}`;
        chunks.push(header);

        // Data Frames
        // Format: D|index|total|base64data
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.CHUNK_SIZE;
            const end = Math.min(start + this.CHUNK_SIZE, uint8.length);
            const chunkData = uint8.slice(start, end);
            const b64 = utils.arrayBufferToBase64(chunkData);
            chunks.push(`D|${i}|${totalChunks}|${b64}`);
        }
        
        return chunks;
    },

    reconstructFile(metadata, chunksMap) {
        // Concatenate all Uint8Arrays
        const totalSize = parseInt(metadata.size);
        const finalArray = new Uint8Array(totalSize);
        let offset = 0;

        for (let i = 0; i < metadata.totalChunks; i++) {
            const chunkData = chunksMap.get(i);
            if (!chunkData) throw new Error(`Missing chunk ${i}`);
            finalArray.set(chunkData, offset);
            offset += chunkData.length;
        }

        const blob = new Blob([finalArray], { type: metadata.mime });
        
        // Trigger Download
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = metadata.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};
