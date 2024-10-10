// dbService.js

const dbName = 'ChatApp';
const storeName = 'Keys';
let db;

// Open IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Create the object store if it doesn't exist
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'channel_id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Function to add or update the private key
async function savePrivateKey(channel_id, privateKey) {
    await openDatabase(); // Ensure the database is opened
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);

        const keyData = {
            channel_id: channel_id,
            privateKey: privateKey
        };

        const request = objectStore.put(keyData); // Use put to insert or update

        request.onsuccess = () => {
            console.log('Private key stored successfully');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error storing private key:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Function to retrieve the private key
async function getPrivateKey(channel_id) {
    await openDatabase(); // Ensure the database is opened
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.get(channel_id); // Get the user data by channel_id
        request.onsuccess = (event) => {
            const data = event.target.result;
            if (data) {
                resolve(data.privateKey); // Return the private key
            } else {
                reject('User not found');
            }
        };

        request.onerror = (event) => {
            console.error('Error retrieving private key:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

// Export the functions for external use
export { savePrivateKey, getPrivateKey };
