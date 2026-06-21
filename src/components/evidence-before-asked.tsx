'use client';

import { AnimatedStatement } from './animated-statement';

export default function EvidenceBeforeAsked() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Evidence built before' },
        { text: 'Amazon asks for it.', strong: true },
      ]}
    />
  );
}
