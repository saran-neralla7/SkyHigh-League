import React, { useRef, useState } from 'react';
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 150; // Keep very tiny so it fits safely in Firestore Document limits!
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress heavily as JPEG to ensure it fits in Firestore
        const base64String = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(img.src);
        resolve(base64String);
      };
      img.onerror = () => reject('Failed to load image');
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalMsg("Please select a valid image file.");
      setModalOpen(true);
      return;
    }

    setUploading(true);
    
    try {
       // Bypasses Firebase Storage entirely to avoid Paywalls/Credit Card requirements.
       // We compress the image heavily into a ~5KB Base64 String and save it directly to Firestore.
       const base64Image = await compressImage(file);
       
       const pRef = doc(db, 'players', playerId);
       await updateDoc(pRef, { profileImage: base64Image });

       onUploadSuccess(base64Image);
       setUploading(false);
    } catch (error) {
       console.error("Upload failed", error);
       setModalMsg("Failed to process and upload image.");
       setModalOpen(true);
       setUploading(false);
    }
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
