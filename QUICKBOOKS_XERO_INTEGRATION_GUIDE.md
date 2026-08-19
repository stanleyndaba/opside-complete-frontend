# Technical Specification: QuickBooks and Xero Integration Architecture

**Author:** Manus AI  
**Date:** August 19, 2026  
**Subject:** Implementation Framework for Financial Accounting Integrations  

---

### Executive Summary

This specification outlines the architectural requirements and implementation patterns for integrating QuickBooks Online and Xero into the Margin platform. These integrations are designed to facilitate the forensic reconciliation of Amazon marketplace records with authoritative financial artifacts stored in accounting systems. The following sections detail the OAuth 2.0 configurations, backend endpoint requirements, and data ingestion logic necessary for a seamless deployment.

---

### 1. OAuth 2.0 Configuration and Security

The integration framework utilizes the standard OAuth 2.0 Authorization Code flow to ensure secure, user-consented access to financial data. Both QuickBooks and Xero require specific scopes to access the necessary accounting entities while maintaining the principle of least privilege.

| Provider | Authorization Endpoint | Token Endpoint | Required Scopes |
| :--- | :--- | :--- | :--- |
| **QuickBooks** | `https://appcenter.intuit.com/connect/oauth2` | `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer` | `com.intuit.quickbooks.accounting`, `openid`, `profile`, `email` |
| **Xero** | `https://login.xero.com/identity/connect/authorize` | `https://identity.xero.com/connect/token` | `openid`, `profile`, `email`, `accounting.invoices.read`, `accounting.payments.read`, `accounting.banktransactions.read`, `accounting.settings.read`, `offline_access` |

> **Security Note:** All access and refresh tokens must be encrypted at rest using industry-standard AES-256 encryption. The `state` parameter must be a cryptographically secure random string validated upon callback to prevent Cross-Site Request Forgery (CSRF).

---

### 2. Backend API Infrastructure

The Node.js backend on Render must implement three primary categories of endpoints to support the integration lifecycle: connection initiation, callback processing, and disconnection management.

The connection initiation endpoint (`POST /api/v1/integrations/:provider/connect`) is responsible for generating the provider-specific authorization URL. This URL must include the `tenant_slug` and a secure `redirect_uri` configured in the respective developer portals.

The callback processing endpoint (`GET /api/v1/integrations/:provider/callback`) handles the redirection from the provider. For QuickBooks, the backend must capture the `realmId` (Company ID) along with the authorization code. For Xero, an additional call to the `/connections` endpoint is required to retrieve the `tenantId`. These identifiers are critical for routing subsequent API requests to the correct organizational context.

---

### 3. Data Ingestion and Forensic Extraction

The background ingestion engine follows a pull-based model, periodically synchronizing financial records to the `evidence_sources` repository. The extraction logic prioritizes entities that provide proof of ownership, shipment, and payment.

For **QuickBooks Online**, the system executes SQL-like queries via the Intuit Data Service. Primary targets include the `Invoice` and `Payment` entities, where the engine extracts vendor metadata, transaction amounts, and SKU-level line items.

For **Xero**, the system utilizes the Accounting API with the `xero-tenant-id` header. The ingestion process focuses on the `Invoices` and `BankTransactions` endpoints. The extracted data is then normalized into the Margin forensic schema, enabling automated matching against Amazon's settlement reports.

---

### 4. Database Schema Requirements

The `evidence_sources` table must be extended or configured to store the persistent connection metadata for each tenant.

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `provider` | `VARCHAR(50)` | Identifies the source (e.g., 'quickbooks', 'xero'). |
| `realm_id` | `VARCHAR(100)` | The QuickBooks Company ID (Realm ID). |
| `xero_tenant_id` | `UUID` | The Xero Organisation ID. |
| `access_token` | `TEXT` | Encrypted token for API authentication. |
| `refresh_token` | `TEXT` | Encrypted token for session renewal. |
| `expires_at` | `TIMESTAMP` | Absolute expiration time of the current access token. |

---

### 5. Implementation Roadmap

The deployment of these integrations should proceed in three phases:
1.  **Sandbox Validation:** Establish developer accounts and validate the OAuth flow using sandbox companies.
2.  **Schema Migration:** Apply the necessary database updates to support the new provider metadata.
3.  **Worker Deployment:** Deploy the background synchronization workers with robust retry and refresh logic to ensure high data availability.
