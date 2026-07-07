'use client';

import { AnimatedStatement } from './animated-statement';

export default function LearningRecovery() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Margin does not blindly fire claims. The seller stays in control.' },
        { text: 'Incompetent disputes are held until the evidence is strong enough.', strong: true },
      ]}
    />
  );
}
