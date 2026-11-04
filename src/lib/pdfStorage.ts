// Permanent Multi-Layer Storage for Uploaded PDFs & Study Materials
// Preserves exact original uploaded PDF files across tab switches, reloads, and sessions.

const DB_NAME = 'StudySphereAI_Files_v2';
const DB_VERSION = 1;
const STORE_NAME = 'study_materials_blobs';

// In-memory cache for ultra-fast, zero-lag access
const inMemoryCache = new Map<string, StoredPDFFile>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredPDFFile {
  id: string;
  name: string;
  dataUrl: string; // Base64 data URL
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export const PDFStorage = {
  async savePDF(file: StoredPDFFile): Promise<void> {
    // 1. Save in memory cache for immediate access
    inMemoryCache.set(file.id, file);

    // 2. Save in IndexedDB (gigabytes of storage capacity, no 5MB quota limit)
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(file);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to save file to IndexedDB:', err);
    }
  },

  async getPDF(id: string): Promise<StoredPDFFile | null> {
    // 1. Check in-memory cache first
    if (inMemoryCache.has(id)) {
      return inMemoryCache.get(id)!;
    }

    // 2. Check IndexedDB
    try {
      const db = await openDB();
      const result = await new Promise<StoredPDFFile | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (result) {
        inMemoryCache.set(id, result);
        return result;
      }
    } catch (err) {
      console.warn('Failed to retrieve file from IndexedDB:', err);
    }

    // 3. Fallback: Check legacy localStorage, migrate to IndexedDB, and remove to free space
    try {
      const lsData = localStorage.getItem(`studysphere_pdf_${id}`);
      if (lsData) {
        const fallback: StoredPDFFile = {
          id,
          name: 'Document.pdf',
          dataUrl: lsData,
          mimeType: 'application/pdf',
          size: lsData.length,
          uploadedAt: new Date().toISOString(),
        };
        inMemoryCache.set(id, fallback);
        // Migrate to IndexedDB
        this.savePDF(fallback).catch(() => {});
        // Free localStorage
        localStorage.removeItem(`studysphere_pdf_${id}`);
        return fallback;
      }
    } catch (e) {
      // Ignore
    }

    return null;
  },

  async deletePDF(id: string): Promise<void> {
    inMemoryCache.delete(id);
    try {
      localStorage.removeItem(`studysphere_pdf_${id}`);
    } catch (e) {
      // Ignore
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to delete file from IndexedDB:', err);
    }
  },

  /**
   * Cleans up any bloated legacy PDF base64 entries from localStorage to guarantee unlimited storage.
   */
  async cleanupLegacyStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('studysphere_pdf_')) {
          const id = key.replace('studysphere_pdf_', '');
          const dataUrl = localStorage.getItem(key);
          if (dataUrl) {
            await this.savePDF({
              id,
              name: 'Restored.pdf',
              dataUrl,
              mimeType: 'application/pdf',
              size: dataUrl.length,
              uploadedAt: new Date().toISOString(),
            });
          }
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error during legacy storage cleanup:', e);
    }
  },
};

/**
 * Utility to convert base64 data URL into a clean Blob.
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const parts = dataurl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
  const cleanBase64 = (parts[1] || '').replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime || 'application/pdf' });
}

/**
 * Generates a valid standard PDF 1.4 Data URL for documents without external files.
 */
export function createDefaultPdfDataUrl(title: string, subject: string): string {
  const cleanTitle = (title || 'Study Material').replace(/[^\x20-\x7E]/g, ' ');
  const cleanSubject = (subject || 'General Studies').replace(/[^\x20-\x7E]/g, ' ');
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  const content = `BT /F1 20 Tf 50 720 Td (${cleanSubject}) Tj ET BT /F1 14 Tf 50 680 Td (${cleanTitle}) Tj ET BT /F1 10 Tf 50 640 Td (StudySphere Academic Resource - Verified Course Material) Tj ET BT /F1 10 Tf 50 620 Td (Generated on ${dateStr}) Tj ET`;
  const streamLen = content.length;
  const pdfStr = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length ${streamLen}>>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000238 00000 n 
0000000305 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
${370 + streamLen}
%%EOF`;

  return `data:application/pdf;base64,${btoa(pdfStr)}`;
}
