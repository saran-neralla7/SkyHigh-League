import React, { useRef, useState } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Camera, Loader2 } from 'lucide-react';
import styles from './ImageUploader.module.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Modal } from './Modal';

interface Props {
  playerId: string;
  currentImage: string;
  onUploadSuccess: (newUrl: string) => void;
  size?: number;
}

export const ImageUploader: React.FC<Props> = ({ playerId, currentImage, onUploadSuccess, size = 64 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalMsg("Please select a valid image file.");
      setModalOpen(true);
      return;
    }

    setUploading(true);
    setProgress(0);

    const storageRef = ref(storage, `profiles/${playerId}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error("Upload failed", error);
        setModalMsg("Upload failed. Ensure Firebase Storage rules are set to allow authenticated uploads.");
        setModalOpen(true);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Update Firestore player document
        const pRef = doc(db, 'players', playerId);
        await updateDoc(pRef, { profileImage: downloadURL });

        onUploadSuccess(downloadURL);
        setUploading(false);
      }
    );
  };

  return (
    <>
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Upload Status" 
        message={modalMsg} 
      />
      <div 
        className={styles.uploaderContainer} 
        style={{ width: size, height: size }}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
      <img 
        src={currentImage} 
        alt="Profile" 
        className={styles.avatarImage} 
        style={{ opacity: uploading ? 0.3 : 1 }}
      />
      
      {!uploading && (
        <div className={styles.overlay}>
          <Camera size={size / 3} color="#fff" />
        </div>
      )}

      {uploading && (
        <div className={styles.uploadingState}>
           <Loader2 size={size / 3} className="animate-spin" color="#EAB308" />
           <span className={styles.progressText}>{Math.round(progress)}%</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
    </>
  );
};
