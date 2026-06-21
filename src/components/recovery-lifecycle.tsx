'use client';

import { AnimatedStatement } from './animated-statement';

export default function RecoveryLifecycle() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Claim filed. Rejection handled.' },
        { text: 'Payout tracked.', strong: true },
      ]}
    />
  );
}
