/**
 * Friendly Error Messages Utility
 * Maps technical errors to user-friendly, polite messages
 * Used across the app for graceful error handling
 */

// Error categories for classification
export type ErrorCategory =
    | 'document_parsing'
    | 'api_timeout'
    | 'payment'
    | 'sync'
    | 'authentication'
    | 'network'
    | 'validation'
    | 'rate_limit'
    | 'unknown';

// Friendly error response structure
export interface FriendlyError {
    title: string;
    message: string;
    suggestion?: string;
    category: ErrorCategory;
    severity: 'info' | 'warning' | 'error';
    recoverable: boolean;
}

/**
 * Document/PDF parsing error messages
 */
const documentErrors: Record<string, FriendlyError> = {
    corrupted_pdf: {
        title: 'Unreadable Document',
        message: "We couldn't read this file. It may be corrupted or damaged.",
        suggestion: 'Please try uploading a clearer version.',
        category: 'document_parsing',
        severity: 'warning',
        recoverable: true
    },
    password_protected: {
        title: 'Protected Document',
        message: 'This document is password-protected.',
        suggestion: 'Please upload an unlocked version.',
        category: 'document_parsing',
        severity: 'warning',
        recoverable: true
    },
    scanned_image: {
        title: 'Scanned Document',
        message: 'This appears to be a scanned image with unclear text.',
        suggestion: 'For best results, upload the original digital document.',
        category: 'document_parsing',
        severity: 'info',
        recoverable: true
    },
    empty_document: {
        title: 'Empty Document',
        message: 'This document appears to be empty or has no readable text.',
        suggestion: 'Please check the file and try again.',
        category: 'document_parsing',
        severity: 'warning',
        recoverable: true
    },
    unsupported_format: {
        title: 'Unsupported Format',
        message: 'This file format is not supported.',
        suggestion: 'Please upload a PDF, PNG, or JPG file.',
        category: 'document_parsing',
        severity: 'warning',
        recoverable: true
    },
    file_too_large: {
        title: 'File Too Large',
        message: 'This file exceeds the maximum size limit.',
        suggestion: 'Please upload a file under 25MB.',
        category: 'document_parsing',
        severity: 'warning',
        recoverable: true
    }
};

/**
 * API/Sync timeout error messages
 */
const timeoutErrors: Record<string, FriendlyError> = {
    sync_timeout: {
        title: 'Taking Longer Than Expected',
        message: 'This is a large account! We are processing in the background.',
        suggestion: "We'll notify you when it's ready.",
        category: 'api_timeout',
        severity: 'info',
        recoverable: true
    },
    amazon_slow: {
        title: 'Amazon API is Slow',
        message: "Amazon's servers are responding slowly right now.",
        suggestion: 'Your sync will continue in the background.',
        category: 'api_timeout',
        severity: 'info',
        recoverable: true
    },
    request_timeout: {
        title: 'Connection Timeout',
        message: 'The request took too long to complete.',
        suggestion: 'Please try again in a moment.',
        category: 'api_timeout',
        severity: 'warning',
        recoverable: true
    }
};

/**
 * Payment error messages (Paystack/Stripe)
 */
const paymentErrors: Record<string, FriendlyError> = {
    card_declined: {
        title: 'Card Declined',
        message: "Your bank declined the transaction. Don't worry, you haven't been charged.",
        suggestion: 'Try a different card?',
        category: 'payment',
        severity: 'warning',
        recoverable: true
    },
    insufficient_funds: {
        title: 'Insufficient Funds',
        message: 'There are insufficient funds on this card.',
        suggestion: 'Try a different card or payment method.',
        category: 'payment',
        severity: 'warning',
        recoverable: true
    },
    expired_card: {
        title: 'Expired Card',
        message: 'This card has expired.',
        suggestion: 'Please use a different card.',
        category: 'payment',
        severity: 'warning',
        recoverable: true
    },
    invalid_card: {
        title: 'Invalid Card',
        message: 'The card number appears to be incorrect.',
        suggestion: 'Please check the card details and try again.',
        category: 'payment',
        severity: 'warning',
        recoverable: true
    },
    payment_failed: {
        title: "Payment Couldn't be Processed",
        message: 'We were unable to process this payment. No charges were made.',
        suggestion: 'Please try again or use a different payment method.',
        category: 'payment',
        severity: 'warning',
        recoverable: true
    },
    payment_cancelled: {
        title: 'Payment Cancelled',
        message: 'The payment was cancelled. No charges were made.',
        suggestion: '',
        category: 'payment',
        severity: 'info',
        recoverable: true
    }
};

/**
 * Authentication error messages
 */
const authErrors: Record<string, FriendlyError> = {
    session_expired: {
        title: 'Session Expired',
        message: 'Your session has expired for security reasons.',
        suggestion: 'Please log in again to continue.',
        category: 'authentication',
        severity: 'warning',
        recoverable: true
    },
    session_paused: {
        title: 'Session Paused',
        message: 'For your security, we paused the session.',
        suggestion: 'Enter your password to resume exactly where you left off.',
        category: 'authentication',
        severity: 'info',
        recoverable: true
    },
    unauthorized: {
        title: 'Access Denied',
        message: "You don't have permission to access this resource.",
        suggestion: 'Please contact support if you believe this is an error.',
        category: 'authentication',
        severity: 'warning',
        recoverable: false
    },
    amazon_disconnected: {
        title: 'Amazon Connection Lost',
        message: 'Your Amazon account connection has expired.',
        suggestion: 'Please reconnect your Amazon account.',
        category: 'authentication',
        severity: 'warning',
        recoverable: true
    },
    amazon_permission_denied: {
        title: 'Additional Permissions Needed',
        message: 'We connected to your store, but some permissions are missing.',
        suggestion: 'Click here to update permissions in Amazon Seller Central.',
        category: 'authentication',
        severity: 'warning',
        recoverable: true
    }
};

/**
 * Network error messages
 */
const networkErrors: Record<string, FriendlyError> = {
    network_offline: {
        title: 'No Internet Connection',
        message: "You appear to be offline.",
        suggestion: 'Please check your internet connection and try again.',
        category: 'network',
        severity: 'warning',
        recoverable: true
    },
    server_error: {
        title: 'Server Issue',
        message: 'We encountered a temporary issue on our end.',
        suggestion: 'Please try again in a moment. Our team has been notified.',
        category: 'network',
        severity: 'error',
        recoverable: true
    },
    service_unavailable: {
        title: 'Service Temporarily Unavailable',
        message: "We're performing maintenance.",
        suggestion: 'Please check back in a few minutes.',
        category: 'network',
        severity: 'info',
        recoverable: true
    }
};

/**
 * Rate limit error messages
 */
const rateLimitErrors: Record<string, FriendlyError> = {
    rate_limited: {
        title: 'Slowing Down',
        message: "We're processing your requests carefully.",
        suggestion: 'Please wait a moment before trying again.',
        category: 'rate_limit',
        severity: 'info',
        recoverable: true
    },
    amazon_rate_limit: {
        title: 'Amazon API Limit',
        message: "Amazon has temporarily limited our requests.",
        suggestion: 'Your sync will resume automatically in a few minutes.',
        category: 'rate_limit',
        severity: 'info',
        recoverable: true
    },
    claim_queue_active: {
        title: 'Filing Claims Safely',
        message: 'We are sending these to Amazon one by one to avoid flagging your account.',
        suggestion: '',
        category: 'rate_limit',
        severity: 'info',
        recoverable: true
    }
};

/**
 * Sync/Audit success messages (not errors, but positive states)
 */
const syncMessages: Record<string, FriendlyError> = {
    zero_findings: {
        title: 'Account 100% Reconciled',
        message: 'We audited your account and found ZERO errors.',
        suggestion: 'Your operations are excellent. We\'ll keep monitoring.',
        category: 'sync',
        severity: 'info',
        recoverable: true
    },
    sync_complete: {
        title: 'Scan Complete',
        message: 'Your account has been audited successfully.',
        suggestion: '',
        category: 'sync',
        severity: 'info',
        recoverable: true
    }
};

/**
 * All error mappings combined
 */
const allErrors: Record<string, FriendlyError> = {
    ...documentErrors,
    ...timeoutErrors,
    ...paymentErrors,
    ...authErrors,
    ...networkErrors,
    ...rateLimitErrors,
    ...syncMessages
};

/**
 * Get friendly error message from error code
 */
export function getFriendlyError(code: string): FriendlyError {
    return allErrors[code] || {
        title: 'Something Went Wrong',
        message: 'We encountered an unexpected issue.',
        suggestion: 'Please try again. If the problem persists, contact support.',
        category: 'unknown',
        severity: 'error',
        recoverable: true
    };
}

/**
 * Map HTTP status codes to friendly errors
 */
export function getFriendlyErrorFromStatus(status: number): FriendlyError {
    switch (status) {
        case 400:
            return getFriendlyError('validation_error');
        case 401:
            return getFriendlyError('session_expired');
        case 403:
            return getFriendlyError('unauthorized');
        case 404:
            return {
                title: 'Not Found',
                message: "The requested resource couldn't be found.",
                suggestion: 'Please check the URL or try again.',
                category: 'unknown',
                severity: 'warning',
                recoverable: false
            };
        case 408:
        case 504:
            return getFriendlyError('request_timeout');
        case 429:
            return getFriendlyError('rate_limited');
        case 500:
        case 502:
        case 503:
            return getFriendlyError('server_error');
        default:
            return getFriendlyError('unknown');
    }
}

/**
 * Map technical error messages to friendly versions
 */
export function mapErrorMessage(technicalMessage: string): FriendlyError {
    const lowerMessage = technicalMessage.toLowerCase();

    // Document errors
    if (lowerMessage.includes('pdf') && lowerMessage.includes('corrupt')) {
        return getFriendlyError('corrupted_pdf');
    }
    if (lowerMessage.includes('password') || lowerMessage.includes('encrypted')) {
        return getFriendlyError('password_protected');
    }
    if (lowerMessage.includes('ocr') || lowerMessage.includes('scanned')) {
        return getFriendlyError('scanned_image');
    }
    if (lowerMessage.includes('empty') || lowerMessage.includes('no text')) {
        return getFriendlyError('empty_document');
    }

    // Network/timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
        return getFriendlyError('request_timeout');
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused')) {
        return getFriendlyError('network_offline');
    }

    // Auth errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
        return getFriendlyError('session_expired');
    }
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
        return getFriendlyError('unauthorized');
    }
    if (lowerMessage.includes('accessdenied') || lowerMessage.includes('access denied') || lowerMessage.includes('permission')) {
        return getFriendlyError('amazon_permission_denied');
    }

    // Rate limit
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
        return getFriendlyError('rate_limited');
    }

    // Server errors
    if (lowerMessage.includes('500') || lowerMessage.includes('internal server')) {
        return getFriendlyError('server_error');
    }

    // Default
    return getFriendlyError('unknown');
}

export default {
    getFriendlyError,
    getFriendlyErrorFromStatus,
    mapErrorMessage
};
