'use client';

import { AnimatedStatement } from './animated-statement';

export default function AuditReadyHistory() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Your full recovery history,' },
        { text: 'always audit-ready.', strong: true },
      ]}
    />
  );
}
