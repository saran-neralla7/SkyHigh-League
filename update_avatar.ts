import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

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

async function run() {
  console.log("Fetching players...");
  const snapshot = await getDocs(collection(db, "players"));
  let targetRef = null;
  snapshot.forEach((pDoc) => {
    if (pDoc.data().name.includes("Saran Neralla")) {
      targetRef = doc(db, "players", pDoc.id);
      console.log("Found player Saran Neralla!", pDoc.id);
    }
  });

  if (targetRef) {
    await updateDoc(targetRef, { profileImage: "/avatars/saran.jpg" });
    console.log("Successfully updated profileImage in live database!");
  } else {
    console.log("Player 'Saran Neralla' not found.");
  }
}

run();
