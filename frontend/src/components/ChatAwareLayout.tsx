'use client';

import { useChat } from '../contexts/ChatContext';
import { useState, useEffect } from 'react';

interface ChatAwareLayoutProps {
  children: React.ReactNode;
}

export default function ChatAwareLayout({ children }: ChatAwareLayoutProps) {
  const { isOpen } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Listen for collapse state changes from the sidebar
  useEffect(() => {
    const handleCollapseChange = (e: CustomEvent) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    window.addEventListener('chatCollapseChanged' as any, handleCollapseChange);
    return () => window.removeEventListener('chatCollapseChanged' as any, handleCollapseChange);
  }, []);
  
  const getRightMargin = () => {
    if (!isOpen) return 'mr-0';
    return isCollapsed ? 'mr-12' : 'mr-96';
  };
  
  return (
    <div className={`min-h-screen transition-all duration-300 ${getRightMargin()}`}>
      {children}
    </div>
  );
}
