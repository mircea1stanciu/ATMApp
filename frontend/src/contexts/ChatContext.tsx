'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Persist chat state to localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const savedState = localStorage.getItem('chatState');
    if (savedState) {
      try {
        const { isOpen: savedIsOpen, activeCommunityId: savedCommunityId } = JSON.parse(savedState);
        setIsOpen(savedIsOpen || false);
        setActiveCommunityId(savedCommunityId || null);
      } catch (e) {
        console.error('Error loading chat state:', e);
      }
    }
  }, [isClient]);



  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;
    
    localStorage.setItem('chatState', JSON.stringify({
      isOpen,
      activeCommunityId
    }));
  }, [isClient, isOpen, activeCommunityId]);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        activeCommunityId,
        setActiveCommunityId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
