import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmText, 
  onConfirm,
  isDestructive = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div 
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className={styles.header}>
              <h3>{title}</h3>
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.body}>
              <p>{message}</p>
            </div>
            <div className={styles.footer}>
              <button className={styles.cancelBtn} onClick={onClose}>
                {onConfirm ? "Cancel" : "Close"}
              </button>
              {onConfirm && (
                <button 
                  className={isDestructive ? styles.destructiveBtn : styles.confirmBtn}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {confirmText || "Confirm"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
