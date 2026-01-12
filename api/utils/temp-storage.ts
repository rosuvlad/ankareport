// Temporary JSON storage for large payloads
// Stores layout/data in filesystem and serves via HTTP endpoint
// Files are cleaned up after request completion

import { mkdir, rm } from 'fs/promises';
import { createWriteStream as createWriteStreamSync, createReadStream as createReadStreamSync, existsSync, readFileSync, readdir as readdirSync, statSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const TEMP_DIR = process.env.TEMP_DIR || join(process.cwd(), 'tmp', 'ankareport-data');
const CLEANUP_DELAY_MS = parseInt(process.env.TEMP_CLEANUP_DELAY_MS || '300000'); // 5 minutes default
const MAX_AGE_MS = parseInt(process.env.TEMP_MAX_AGE_MS || '3600000'); // 1 hour default (files older than this are considered stale)

// Ensure temp directory exists
export async function ensureTempDir(): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Helper to stream JSON to file
async function streamJsonToFile(filePath: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStreamSync(filePath, { encoding: 'utf-8' });
    
    // Create a transform stream to stringify JSON
    const jsonStream = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk);
      }
    });
    
    // Write the JSON string in chunks to avoid blocking
    const jsonString = JSON.stringify(data);
    const chunkSize = 64 * 1024; // 64KB chunks
    
    let offset = 0;
    const writeChunk = () => {
      if (offset >= jsonString.length) {
        writeStream.end();
        return;
      }
      
      const chunk = jsonString.slice(offset, offset + chunkSize);
      if (!writeStream.write(chunk)) {
        writeStream.once('drain', writeChunk);
      } else {
        setImmediate(writeChunk);
      }
      offset += chunkSize;
    };
    
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    
    writeChunk();
  });
}

// Store layout and data, return GUID and cleanup function
export async function storeReportData(layout: any, data: any): Promise<{ guid: string; cleanup: () => Promise<void> }> {
  await ensureTempDir();
  
  const guid = randomUUID();
  const dirPath = join(TEMP_DIR, guid);
  await mkdir(dirPath, { recursive: true });
  
  const layoutPath = join(dirPath, 'layout.json');
  const dataPath = join(dirPath, 'data.json');
  
  // Write files in parallel using streaming
  await Promise.all([
    streamJsonToFile(layoutPath, layout),
    streamJsonToFile(dataPath, data),
  ]);
  
  // Create cleanup function
  const cleanup = async (): Promise<void> => {
    await cleanupReportData(guid);
  };
  
  // Schedule backup cleanup (in case immediate cleanup fails)
  const timeoutId = setTimeout(() => {
    cleanupReportData(guid).catch((error) => {
      console.error(`Error in backup cleanup for report data ${guid}:`, error);
    });
  }, CLEANUP_DELAY_MS);
  
  // Return GUID and cleanup function
  // Note: The timeout is not cleared - it serves as a backup safety mechanism
  // If immediate cleanup is called, the cleanup function will handle it gracefully
  return { guid, cleanup };
}

// Clean up stored data
export async function cleanupReportData(guid: string): Promise<void> {
  const dirPath = join(TEMP_DIR, guid);
  
  if (!existsSync(dirPath)) {
    return; // Already cleaned up
  }
  
  try {
    // Delete directory recursively (includes files)
    await rm(dirPath, { recursive: true, force: true }).catch(() => {
      // Ignore errors if directory doesn't exist or is already deleted
    });
  } catch (error) {
    console.error(`Error cleaning up report data ${guid}:`, error);
    throw error;
  }
}

// Clean up all stale temp files (older than MAX_AGE_MS)
export async function cleanupStaleFiles(): Promise<number> {
  await ensureTempDir();
  
  if (!existsSync(TEMP_DIR)) {
    return 0;
  }
  
  let cleanedCount = 0;
  const now = Date.now();
  
  try {
    const entries = await readdir(TEMP_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = join(TEMP_DIR, entry.name);
        
        try {
          // Check directory modification time
          const stats = statSync(dirPath);
          const age = now - stats.mtimeMs;
          
          if (age > MAX_AGE_MS) {
            // Directory is stale, clean it up
            await rm(dirPath, { recursive: true, force: true });
            cleanedCount++;
          }
        } catch (error) {
          // If we can't read the directory or it doesn't exist, try to remove it
          try {
            await rm(dirPath, { recursive: true, force: true });
            cleanedCount++;
          } catch (removeError) {
            // Ignore errors - directory might not exist or be locked
            console.warn(`Warning: Could not clean up directory ${entry.name}:`, removeError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during stale file cleanup:', error);
  }
  
  return cleanedCount;
}

// Clean up all temp files (use with caution - should only be called on startup)
export async function cleanupAllFiles(): Promise<number> {
  await ensureTempDir();
  
  if (!existsSync(TEMP_DIR)) {
    return 0;
  }
  
  let cleanedCount = 0;
  
  try {
    const entries = await readdir(TEMP_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = join(TEMP_DIR, entry.name);
        
        try {
          await rm(dirPath, { recursive: true, force: true });
          cleanedCount++;
        } catch (error) {
          // Ignore errors - directory might not exist or be locked
          console.warn(`Warning: Could not clean up directory ${entry.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error during full cleanup:', error);
  }
  
  return cleanedCount;
}

// Read layout file for a GUID (for internal server - uses streaming)
export function createLayoutFileStream(guid: string): NodeJS.ReadableStream {
  const layoutPath = join(TEMP_DIR, guid, 'layout.json');
  if (!existsSync(layoutPath)) {
    throw new Error(`Layout file not found for GUID: ${guid}`);
  }
  return createReadStreamSync(layoutPath, { encoding: 'utf-8' });
}

// Read data file for a GUID (for internal server - uses streaming)
export function createDataFileStream(guid: string): NodeJS.ReadableStream {
  const dataPath = join(TEMP_DIR, guid, 'data.json');
  if (!existsSync(dataPath)) {
    throw new Error(`Data file not found for GUID: ${guid}`);
  }
  return createReadStreamSync(dataPath, { encoding: 'utf-8' });
}

// Read layout file for a GUID (for direct access - non-streaming, kept for backward compatibility)
export function readLayoutFile(guid: string): any {
  const layoutPath = join(TEMP_DIR, guid, 'layout.json');
  if (!existsSync(layoutPath)) {
    throw new Error(`Layout file not found for GUID: ${guid}`);
  }
  return JSON.parse(readFileSync(layoutPath, 'utf-8'));
}

// Read data file for a GUID (for direct access - non-streaming, kept for backward compatibility)
export function readDataFile(guid: string): any {
  const dataPath = join(TEMP_DIR, guid, 'data.json');
  if (!existsSync(dataPath)) {
    throw new Error(`Data file not found for GUID: ${guid}`);
  }
  return JSON.parse(readFileSync(dataPath, 'utf-8'));
}
