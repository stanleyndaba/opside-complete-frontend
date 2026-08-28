export type AuditExperienceStep =
  | 'public'
  | 'ready'
  | 'connect'
  | 'syncing'
  | 'detecting'
  | 'completed'
  | 'failed';

export type AuditExperienceAction =
  | 'start_account'
  | 'start_audit'
  | 'continue_audit'
  | 'connect_amazon'
  | 'retry_audit'
  | 'check_connection'
  | 'check_progress'
  | 'review_results'
  | 'reload_result'
  | 'upload_reports'
  | 'wait_for_auth';

export type AuditConnectionState = {
  connected: boolean;
  needs_reconnect: boolean;
  status: 'connected' | 'connection_required' | 'reconnect_required' | 'unavailable' | 'error';
} | null;

export type AuditExperienceDecision = {
  statusLabel: string;
  title: string;
  description: string;
  primaryAction: AuditExperienceAction;
  primaryLabel: string;
  primaryWhy: string;
  secondaryAction?: 'upload_reports';
  secondaryLabel?: string;
};

export type AuditScheduleAction = 'connect_amazon' | 'check_progress' | 'review_results' | 'upload_reports' | null;

export type AuditScheduleDecision = {
  connectionLabel: string;
  action: AuditScheduleAction;
  actionLabel?: string;
  actionWhy?: string;
};

/**
 * The schedule control is workspace-owned, but it must not turn an existing
 * manual report Audit into an Amazon OAuth journey. Manual actions remain on
 * the recorded report rail; only SP-API schedule states may request Amazon.
 */
export function getAuditScheduleDecision(input: {
  isManualAudit: boolean;
  step: AuditExperienceStep;
  amazonConnected: boolean | null;
}): AuditScheduleDecision {
  if (input.isManualAudit) {
    if (input.step === 'completed') {
      return {
        connectionLabel: 'Manual report audit: Results ready',
        action: 'review_results',
        actionLabel: 'Review results',
        actionWhy: 'This audit uses the uploaded reports already recorded for this workspace.',
      };
    }

    if (input.step === 'failed') {
      return {
        connectionLabel: 'Manual report audit: Reports need attention',
        action: 'upload_reports',
        actionLabel: 'Upload reports',
        actionWhy: 'Manual audits remain on the report workflow; Amazon authorization is not required.',
      };
    }

    return {
      connectionLabel: 'Manual report audit: Reviewing recorded reports',
      action: 'check_progress',
      actionLabel: 'Check audit progress',
      actionWhy: 'Manual audits remain on the report workflow; Amazon authorization is not required.',
    };
  }

  if (input.amazonConnected === false) {
    return {
      connectionLabel: 'Amazon connection: Action required',
      action: 'connect_amazon',
      actionLabel: 'Connect Amazon',
      actionWhy: 'Amazon access is required for the SP-API audit route.',
    };
  }

  return {
    connectionLabel: `Amazon connection: ${input.amazonConnected === true ? 'Connected' : 'Checking'}`,
    action: null,
  };
}

export function getAuditExperienceDecision(input: {
  isAuthenticationResolving: boolean;
  isAuthenticated: boolean;
  step: AuditExperienceStep;
  hasAudit: boolean;
  isManualAudit: boolean;
  amazon: AuditConnectionState;
  isConnectionChecking: boolean;
  resultsUnavailable: boolean;
}): AuditExperienceDecision {
  if (input.isAuthenticationResolving) {
    return {
      statusLabel: 'Checking your secure session',
      title: 'Margin is confirming your secure session.',
      description: 'Your audit path will appear as soon as Margin finishes checking whether you are signed in.',
      primaryAction: 'wait_for_auth',
      primaryLabel: 'Checking your secure session',
      primaryWhy: 'Margin does not start an audit or account journey until your session status is known.',
    };
  }

  if (!input.isAuthenticated) {
    return {
      statusLabel: 'Start your audit',
      title: 'Start with the Amazon records behind your recovery question.',
      description: 'Create or sign in to your Margin account, then choose the Amazon connection or report path that fits this audit.',
      primaryAction: 'start_account',
      primaryLabel: 'Start free audit',
      primaryWhy: 'Margin needs a secure account before it can keep this audit record together.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports',
    };
  }

  if (input.step === 'completed' && input.resultsUnavailable) {
    return {
      statusLabel: 'Result needs reloading',
      title: 'Your audit record is available, but the result details need to be reloaded.',
      description: 'Margin cannot show a recommendation or checkout until the recorded result details are available again.',
      primaryAction: 'reload_result',
      primaryLabel: 'Reload audit result',
      primaryWhy: 'This refreshes the recorded result; it does not change the audit.',
    };
  }

  if (input.isManualAudit) {
    if (input.step === 'completed') {
      return {
        statusLabel: 'Report review ready',
        title: 'Your uploaded Amazon report review is ready.',
        description: 'Review the recorded coverage and findings from the reports supplied to this audit.',
        primaryAction: 'review_results',
        primaryLabel: 'Review results',
        primaryWhy: 'The next decision should be based on the recorded report coverage and findings.',
      };
    }

    if (input.step === 'failed') {
      return {
        statusLabel: 'Reports need attention',
        title: 'This uploaded-report audit needs attention.',
        description: 'Review the report details or upload a supported report set before retrying this manual audit.',
        primaryAction: 'upload_reports',
        primaryLabel: 'Upload reports',
        primaryWhy: 'Manual audits use the reports you choose to provide; Amazon authorization is not required.',
      };
    }

    if (input.step === 'syncing' || input.step === 'detecting') {
      return {
        statusLabel: 'Reviewing reports',
        title: 'Margin is reviewing the uploaded Amazon reports.',
        description: 'This audit is using the report coverage supplied to Margin. Refresh when you are ready to check its recorded progress.',
        primaryAction: 'check_progress',
        primaryLabel: 'Check audit progress',
        primaryWhy: 'Margin keeps the manual report rail separate from Amazon connection status.',
      };
    }
  }

  if (input.step === 'completed') {
    return {
      statusLabel: 'Results ready',
      title: 'Your audit results are ready to review.',
      description: 'Review the recorded scope, coverage, and evidence before deciding on any seller-controlled next step.',
      primaryAction: 'review_results',
      primaryLabel: 'Review results',
      primaryWhy: 'Audit results identify potential scope; they do not authorize a claim, payment, or filing.',
    };
  }

  if (input.step === 'syncing' || input.step === 'detecting') {
    return {
      statusLabel: input.step === 'syncing' ? 'Amazon data is syncing' : 'Audit review is in progress',
      title: input.step === 'syncing'
        ? 'Margin is collecting the Amazon records for this audit.'
        : 'Margin is reviewing the Amazon activity that was collected.',
      description: 'The audit is still in progress. Refresh when you are ready to see the latest recorded status.',
      primaryAction: 'check_progress',
      primaryLabel: 'Check audit progress',
      primaryWhy: 'Margin will only show the result after the recorded audit reaches a completed state.',
    };
  }

  if (input.step === 'failed') {
    return {
      statusLabel: 'Audit needs attention',
      title: 'This audit could not finish.',
      description: 'Retry only after Amazon access is available. Margin will recheck the stored connection before it begins work.',
      primaryAction: 'retry_audit',
      primaryLabel: 'Retry audit',
      primaryWhy: 'A retry uses the existing audit record and rechecks Amazon access.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports instead',
    };
  }

  if (!input.amazon) {
    if (input.isConnectionChecking) {
      return {
        statusLabel: 'Checking Amazon connection',
        title: 'Margin is checking whether Amazon is ready for this audit.',
        description: 'Margin cannot safely start the Amazon audit route until it verifies the stored connection for this workspace.',
        primaryAction: 'check_connection',
        primaryLabel: 'Checking Amazon connection',
        primaryWhy: 'Margin does not assume browser or URL state is correct.',
        secondaryAction: 'upload_reports',
        secondaryLabel: 'Use Amazon reports instead',
      };
    }

    return {
      statusLabel: 'Amazon connection unavailable',
      title: 'Margin cannot verify Amazon access for this audit right now.',
      description: 'No Amazon audit has started. Check the connection again, or use supported Amazon reports while access is unavailable.',
      primaryAction: 'check_connection',
      primaryLabel: 'Check Amazon connection',
      primaryWhy: 'Margin will not treat an unavailable connection as ready.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports instead',
    };
  }

  if (input.amazon.needs_reconnect || input.amazon.status === 'reconnect_required') {
    return {
      statusLabel: 'Amazon reconnect required',
      title: 'Amazon access needs to be reconnected before this audit can continue.',
      description: 'Reconnect your seller account so Margin can examine the Amazon records needed for this audit.',
      primaryAction: 'connect_amazon',
      primaryLabel: 'Reconnect Amazon',
      primaryWhy: 'Amazon access must be repaired before Margin can use the SP-API audit route.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports instead',
    };
  }

  if (input.amazon.status === 'unavailable' || input.amazon.status === 'error') {
    return {
      statusLabel: 'Amazon connection needs checking',
      title: 'Margin cannot verify Amazon access for this audit yet.',
      description: 'No Amazon audit has started. Check the connection again, or use supported Amazon reports while access is unavailable.',
      primaryAction: 'check_connection',
      primaryLabel: 'Check Amazon connection',
      primaryWhy: 'Margin will not treat an unavailable connection as ready.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports instead',
    };
  }

  if (!input.amazon.connected) {
    return {
      statusLabel: 'Amazon connection required',
      title: 'Connect Amazon to begin this audit.',
      description: 'Margin needs read-only access to the Amazon records behind this recovery question before it can begin the SP-API audit route.',
      primaryAction: 'connect_amazon',
      primaryLabel: 'Connect Amazon',
      primaryWhy: 'You approve the connection directly through Amazon. Margin never sees your Amazon password.',
      secondaryAction: 'upload_reports',
      secondaryLabel: 'Use Amazon reports instead',
    };
  }

  if (input.step === 'connect') {
    return {
      statusLabel: 'Amazon connection confirmed',
      title: 'Amazon is connected. Continue this audit when you are ready.',
      description: 'Margin has confirmed the stored Amazon connection for this workspace. The audit is ready for its next recorded step.',
      primaryAction: 'continue_audit',
      primaryLabel: 'Continue audit',
      primaryWhy: 'Continuing uses this existing audit record and rechecks Amazon access before work starts.',
    };
  }

  if (input.hasAudit) {
    return {
      statusLabel: 'Audit ready to continue',
      title: 'This audit is ready for its next step.',
      description: 'Margin has the Amazon access needed for this workspace. Continue the existing audit record when you are ready.',
      primaryAction: 'continue_audit',
      primaryLabel: 'Continue audit',
      primaryWhy: 'Continuing keeps this audit record and its Amazon context together.',
    };
  }

  return {
    statusLabel: 'Ready to begin',
    title: 'Amazon is connected and this audit is ready to begin.',
    description: 'Start a read-only Recovery Audit to review the Amazon records available to this workspace.',
    primaryAction: 'start_audit',
    primaryLabel: 'Start audit',
    primaryWhy: 'Margin will create the audit record before it starts any Amazon review.',
    secondaryAction: 'upload_reports',
    secondaryLabel: 'Use Amazon reports instead',
  };
}
