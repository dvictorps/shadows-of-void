import { useState, useRef, useCallback } from 'react';

// Define the type for the message content
type MessageContentType = React.ReactNode;

// Define the return type of the hook
interface UseMessageBoxReturn {
    message: MessageContentType;
    displayPersistentMessage: (newMessage: MessageContentType) => void;
    displayTemporaryMessage: (newMessage: MessageContentType, duration?: number) => void;
    clearMessage: () => void;
}

/**
 * Custom hook to manage the content of a message box, handling temporary
 * and persistent messages with automatic timeout clearing.
 * @param initialMessage The default message to show when no other message is active. Defaults to '...'.
 * @param defaultTemporaryDuration Default duration in milliseconds for temporary messages. Defaults to 2000.
 * @returns An object containing the current message and functions to update it.
 */
export function useMessageBox(
    initialMessage: MessageContentType = '...',
    defaultTemporaryDuration: number = 2000
): UseMessageBoxReturn {
    const [message, setMessage] = useState<MessageContentType>(initialMessage);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clears any existing timeout
    const clearExistingTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            // console.log("[useMessageBox] Cleared existing timeout."); // Optional log
        }
    }, []);

    // Displays a message that persists until another message replaces it or it's cleared.
    const displayPersistentMessage = useCallback((newMessage: MessageContentType) => {
        // console.log("[useMessageBox] Displaying persistent message:", newMessage); // Optional log
        clearExistingTimeout();
        setMessage(newMessage);
    }, [clearExistingTimeout]);

    // Displays a message for a specific duration, then reverts to the initial message.
    const displayTemporaryMessage = useCallback((newMessage: MessageContentType, duration?: number) => {
        // console.log(`[useMessageBox] Displaying temporary message for ${duration ?? defaultTemporaryDuration}ms:`, newMessage); // Optional log
        clearExistingTimeout();
        setMessage(newMessage);
        timeoutRef.current = setTimeout(() => {
            // console.log("[useMessageBox] Temporary message timeout expired. Reverting to initial."); // Optional log
            setMessage(initialMessage);
            timeoutRef.current = null;
        }, duration ?? defaultTemporaryDuration);
    }, [initialMessage, defaultTemporaryDuration, clearExistingTimeout]);

    // Manually clears the current message and reverts to the initial message.
    const clearMessage = useCallback(() => {
        // console.log("[useMessageBox] Clearing message manually."); // Optional log
        clearExistingTimeout();
        setMessage(initialMessage);
    }, [initialMessage, clearExistingTimeout]);

    // Ensure timeout is cleared on unmount
    // This might be redundant if used within a component that manages its lifecycle,
    // but it's a safeguard.
    /* // Commented out as it might cause issues if the hook re-renders often.
       // Cleanup is typically handled by the component using the hook.
    useEffect(() => {
        return () => {
            clearExistingTimeout();
        };
    }, [clearExistingTimeout]);
    */

    return { message, displayPersistentMessage, displayTemporaryMessage, clearMessage };
} 