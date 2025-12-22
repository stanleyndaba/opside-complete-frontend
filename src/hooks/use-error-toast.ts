/**
 * Error Toast Hook
 * Provides convenient functions to show user-friendly error toasts
 * Uses errorUtils for message mapping
 */

import { useToast } from '@/hooks/use-toast';
import { getFriendlyError, getFriendlyErrorFromStatus, mapErrorMessage, type FriendlyError } from '@/lib/errorUtils';

export function useErrorToast() {
    const { toast } = useToast();

    /**
     * Show a friendly error toast from an error code
     */
    const showError = (code: string) => {
        const error = getFriendlyError(code);
        showFriendlyError(error);
    };

    /**
     * Show a friendly error toast from an HTTP status code
     */
    const showStatusError = (status: number) => {
        const error = getFriendlyErrorFromStatus(status);
        showFriendlyError(error);
    };

    /**
     * Show a friendly error toast from a technical error message
     */
    const showMappedError = (technicalMessage: string) => {
        const error = mapErrorMessage(technicalMessage);
        showFriendlyError(error);
    };

    /**
     * Show a friendly error toast from a FriendlyError object
     */
    const showFriendlyError = (error: FriendlyError) => {
        // Build description with suggestion if available
        const description = error.suggestion
            ? `${error.message} ${error.suggestion}`
            : error.message;

        toast({
            title: error.title,
            description,
            variant: error.severity === 'error' ? 'destructive' : 'default',
        });
    };

    /**
     * Show a document parsing error
     */
    const showDocumentError = (filename: string, reason?: string) => {
        const errorCode = reason || 'corrupted_pdf';
        const error = getFriendlyError(errorCode);

        toast({
            title: error.title,
            description: `We couldn't read '${filename}'. ${error.suggestion || 'We\'ve skipped it and continued with the others.'}`,
            variant: 'default',
        });
    };

    /**
     * Show a timeout/long operation message
     */
    const showTimeoutMessage = (isBackground: boolean = false) => {
        if (isBackground) {
            toast({
                title: 'Processing in Background',
                description: "This is taking longer than usual. We'll notify you when it's ready.",
                variant: 'default',
            });
        } else {
            toast({
                title: 'Please Wait',
                description: 'This is a large account! We are processing your data.',
                variant: 'default',
            });
        }
    };

    /**
     * Show a payment error
     */
    const showPaymentError = (code?: string) => {
        const errorCode = code || 'payment_failed';
        const error = getFriendlyError(errorCode);

        toast({
            title: error.title,
            description: `${error.message} ${error.suggestion || ''}`,
            variant: 'default',
        });
    };

    /**
     * Show a network error
     */
    const showNetworkError = () => {
        toast({
            title: 'Connection Issue',
            description: "We couldn't reach the server. Please check your internet and try again.",
            variant: 'destructive',
        });
    };

    /**
     * Show a session expired error
     */
    const showSessionExpired = () => {
        toast({
            title: 'Session Expired',
            description: 'Please log in again to continue.',
            variant: 'default',
        });
    };

    /**
     * Show a generic success message
     */
    const showSuccess = (title: string, description?: string) => {
        toast({
            title,
            description,
            variant: 'default',
        });
    };

    /**
     * Handle API error with automatic message mapping
     */
    const handleApiError = (error: any) => {
        // Check for network errors
        if (!error.response && error.message?.includes('Network')) {
            showNetworkError();
            return;
        }

        // Check for timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            showTimeoutMessage(true);
            return;
        }

        // Check for HTTP status errors
        if (error.response?.status) {
            showStatusError(error.response.status);
            return;
        }

        // Default: try to map the error message
        if (error.message) {
            showMappedError(error.message);
            return;
        }

        // Fallback
        showError('unknown');
    };

    return {
        showError,
        showStatusError,
        showMappedError,
        showFriendlyError,
        showDocumentError,
        showTimeoutMessage,
        showPaymentError,
        showNetworkError,
        showSessionExpired,
        showSuccess,
        handleApiError,
    };
}

export default useErrorToast;
