const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanDisplayValue = (value: unknown): string => (
  typeof value === 'string' ? value.trim() : ''
);

export const isUuidLike = (value: unknown): boolean => {
  const text = cleanDisplayValue(value);
  return UUID_PATTERN.test(text);
};

export const compactReference = (value: unknown, prefix = 'REF'): string => {
  const text = cleanDisplayValue(value);
  if (!text) return prefix;

  if (!isUuidLike(text)) {
    return text;
  }

  const compact = text.replace(/-/g, '');
  const withoutLeadingZeroes = compact.replace(/^0+/, '');
  const visibleToken = (withoutLeadingZeroes || compact).slice(-6).toUpperCase();
  return `${prefix}-${visibleToken}`;
};

export const firstHumanReference = (
  candidates: unknown[],
  fallbackId?: unknown,
  fallbackPrefix = 'REF'
): string => {
  for (const candidate of candidates) {
    const text = cleanDisplayValue(candidate);
    if (text && !isUuidLike(text)) {
      return text;
    }
  }

  return compactReference(fallbackId, fallbackPrefix);
};

export const documentReferenceLabel = (
  doc: any,
  fallbackId?: unknown,
  fallbackPrefix = 'DOC'
): string => {
  const metadata = doc && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata)
    ? doc.metadata
    : {};

  return firstHumanReference(
    [
      doc?.title,
      metadata?.evidence_title,
      metadata?.title,
      doc?.original_filename,
      metadata?.original_filename,
      doc?.filename,
      doc?.name,
      doc?.invoice_number,
      metadata?.invoice_number,
      doc?.external_id
    ],
    fallbackId ?? doc?.id ?? doc?.document_id,
    fallbackPrefix
  );
};

export const claimReferenceLabel = (
  claim: any,
  fallbackId?: unknown,
  fallbackPrefix = 'CASE'
): string => firstHumanReference(
  [
    claim?.reference,
    claim?.case_number,
    claim?.claim_number,
    claim?.amazon_case_id,
    claim?.provider_case_id
  ],
  fallbackId ?? claim?.id ?? claim?.claim_id,
  fallbackPrefix
);
