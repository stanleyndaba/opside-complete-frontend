'use client';

import { AnimatedStatement } from './animated-statement';

export default function MarginReads() {
  return (
    <AnimatedStatement
      lines={[
        { text: 'Scrapes meta-data from shipment records,' },
        { text: 'PODs, BOLs and invoices -' },
        { text: 'for precise case building', strong: true },
      ]}
    />
  );
}
