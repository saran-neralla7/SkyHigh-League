import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeCollection(collectionName: string) {
  console.log(`Wiping collection: ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const promises: Promise<void>[] = [];
  snapshot.forEach(d => {
    promises.push(deleteDoc(doc(db, collectionName, d.id)));
  });
  await Promise.all(promises);
  console.log(`Cleared ${promises.length} documents from ${collectionName}`);
}

async function wipeAll() {
  try {
    await wipeCollection('players');
    await wipeCollection('matches');
    await wipeCollection('entries');
    console.log("Database wiped successfully!");
    process.exit(0);
  } catch(e) {
    console.error("Failed to wipe", e);
    process.exit(1);
  }
}

wipeAll();
