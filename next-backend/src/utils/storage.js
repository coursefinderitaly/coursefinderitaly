const fs = require('fs');
const path = require('path');

// Ensure the 'uploads' directory exists in the project root securely
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        console.log(`[Storage] Creating local upload directory at: ${UPLOAD_DIR}`);
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
} catch (error) {
    console.error(`[Storage Init Error] FATAL PERMISSION DENIED: ${error.message}. Could not generate: ${UPLOAD_DIR}`);
}

/**
 * Saves a readable stream as a file on the local disk.
 */
const uploadZipStream = async (stream, fileName) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(UPLOAD_DIR, fileName);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream)
            .on('error', (err) => {
                console.error("Local save error:", err);
                reject(err);
            })
            .on('finish', () => {
                console.log(`[Local Storage] Saved copy to disk: ${fileName}`);
                resolve(fileName);
            });
    });
};

/**
 * Returns the full path to an uploaded file for attachment/download logic.
 */
const getLocalFilePath = (fileName) => {
    return path.join(UPLOAD_DIR, fileName);
};

/**
 * Generates the download URL pointing to your own server.
 */
const generateSignedUrl = async (objectKey) => {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/api/upload/download/${objectKey}`;
};

module.exports = {
    uploadZipStream,
    generateSignedUrl,
    getLocalFilePath
};
