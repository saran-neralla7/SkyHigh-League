import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';
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
  const fileData = fs.readFileSync("/Users/saranneralla/.gemini/antigravity/brain/0218df4e-9ac6-48b8-817a-abbcf869b624/media__1775007775890.jpg");
  const base64Str = "data:image/jpeg;base64," + fileData.toString('base64');

  console.log("Fetching players...");
  const snapshot = await getDocs(collection(db, "players"));
  let targetRef = null;
  snapshot.forEach((pDoc) => {
    if (pDoc.data().name.includes("Saran Neralla")) {
      targetRef = doc(db, "players", pDoc.id);
      console.log("Found player!", pDoc.id);
    }
  });

  if (targetRef) {
    await updateDoc(targetRef, { profileImage: base64Str });
    console.log("Successfully updated image in database!");
  } else {
    console.log("Player not found");
  }
}
run();
