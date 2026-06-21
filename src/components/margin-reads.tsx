'use client';

import { AnimatedStatement } from './animated-statement';

export default function MarginReads() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Margin reads your shipment records,' },
        { text: 'emails, and invoices —' },
        { text: 'without you lifting a finger.', strong: true },
      ]}
    />
  );
}
