'use client';

import { AnimatedStatement } from './animated-statement';

export default function LearningRecovery() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Learns and improves from every recovery' },
        { text: 'it completes.', strong: true },
      ]}
    />
  );
}
