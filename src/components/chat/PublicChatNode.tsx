import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChatNode } from './ChatNode';

/**
 * Global wrapper for the ChatNode component.
 * Ensures the chatbot only appears on marketing and legal pages,
 * and remains hidden once the user enters the main platform (/app/*).
 */
export function PublicChatNode() {
    const location = useLocation();

    // We might want to hide it on specific auth pages if they feel too crowded
    const isAuthSandbox = location.pathname.includes('sandbox');
    const isAuthSuccess = location.pathname === '/auth/success';

    if (isAuthSandbox || isAuthSuccess) {
        return null;
    }

    return <ChatNode />;
}
