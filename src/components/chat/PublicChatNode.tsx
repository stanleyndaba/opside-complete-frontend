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

    // Define paths where the chatbot should BE HIDDEN
    // Specifically, we don't want it over the main dashboard/platform UI
    const isPlatformPage = location.pathname.startsWith('/app');

    // We also might want to hide it on specific auth pages if they feel too crowded
    const isAuthSandbox = location.pathname.includes('sandbox');

    if (isPlatformPage || isAuthSandbox) {
        return null;
    }

    return <ChatNode />;
}
