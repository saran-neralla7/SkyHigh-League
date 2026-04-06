import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Send } from 'lucide-react';
import type { ChatMessage } from '../lib/db';
import styles from './ChatFeed.module.css';
import { useAuth } from '../AuthContext';

interface ChatFeedProps {
  matchId: string;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({ matchId }) => {
  const { currentUser, playerData } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We only load messages for the specific match
    const q = query(
      collection(db, 'chat'),
      where('matchId', '==', matchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Sort client-side to avoid composite index requirement
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [matchId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    
    const senderName = playerData ? playerData.name : (currentUser.email?.split('@')[0] || 'Guest');

    try {
      await addDoc(collection(db, 'chat'), {
        matchId,
        playerId: currentUser.uid,
        playerName: senderName,
        text: text.trim(),
        timestamp: Date.now()
      });
      setText('');
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(`Could not send message. Error: ${error.message}\nIf this is a permission error, please ask the Admin to update Firebase Firestore Rules to allow writes to the 'chat' collection.`);
    }
  };

  const insertReaction = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>💬 Match Commentary</div>
      </div>
      
      <div className={styles.messagesList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>No comments yet. Be the first to banter!</div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.uid === msg.playerId;
            return (
              <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.mine : styles.theirs}`}>
                {!isMe && <div className={styles.sender}>{msg.playerName}</div>}
                <div className={styles.bubble}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.chatInputWrapper}>
        <div className={styles.reactionsRow}>
          <button type="button" onClick={() => insertReaction('🔥')}>🔥</button>
          <button type="button" onClick={() => insertReaction('😂')}>😂</button>
          <button type="button" onClick={() => insertReaction('🥶')}>🥶</button>
          <button type="button" onClick={() => insertReaction('🦆')}>🦆</button>
          <button type="button" onClick={() => insertReaction('👏')}>👏</button>
        </div>
        <form onSubmit={handleSend} className={styles.inputForm}>
          <input 
            type="text" 
            placeholder={currentUser ? "Drop some banter..." : "Login to chat..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!currentUser}
            className={styles.input}
          />
          <button type="submit" disabled={!text.trim() || !currentUser} className={styles.sendButton}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
