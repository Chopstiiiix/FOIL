// Fix for IndexedDB connection issues
export async function fixIndexedDBConnection() {
  if (typeof window === 'undefined') return;

  // Clear any stale connections
  const databases = await indexedDB.databases?.() || [];

  for (const db of databases) {
    if (db.name?.startsWith('foil_')) {
      try {
        // Close and delete corrupted databases
        const deleteReq = indexedDB.deleteDatabase(db.name);
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = resolve;
          deleteReq.onerror = reject;
        });
        console.log(`Cleared stale database: ${db.name}`);
      } catch (error) {
        console.error(`Failed to clear database ${db.name}:`, error);
      }
    }
  }
}

// Retry mechanism for database operations
export async function retryDBOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.name === 'InvalidStateError' ||
          error?.message?.includes('database connection is closing')) {
        console.warn(`Database operation failed, retry ${i + 1}/${maxRetries}`);

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try to fix the connection
        await fixIndexedDBConnection();
      } else {
        throw error;
      }
    }
  }

  throw new Error('Database operation failed after maximum retries');
}

// Initialize on app start
export function initializeDBFix() {
  if (typeof window === 'undefined') return;

  // Fix any existing issues on load
  fixIndexedDBConnection();

  // Handle errors globally
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'InvalidStateError' ||
        event.reason?.message?.includes('database connection')) {
      console.error('IndexedDB Error detected, attempting fix...');
      fixIndexedDBConnection();
    }
  });
}