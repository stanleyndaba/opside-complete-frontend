import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

const siteUrl = 'https://margin-finance.com';
const defaultImage = `${siteUrl}/margin-logo-reveal.gif`;

const buildAcquisitionStructuredData = ({
  path,
  faqs,
  serviceName,
  serviceType,
  softwareDescription,
  serviceDescription,
}) => {
  const canonical = `${siteUrl}${path}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${canonical}#software`,
        name: 'Margin',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: canonical,
        description: softwareDescription,
        offers: {
          '@type': 'Offer',
          price: '99',
          priceCurrency: 'USD',
          description: 'Early access activation for Margin recovery workflow',
        },
      },
      {
        '@type': 'Service',
        '@id': `${canonical}#service`,
        name: serviceName,
        serviceType,
        provider: {
          '@type': 'Organization',
          name: 'Margin',
          url: `${siteUrl}/`,
        },
        areaServed: 'Worldwide',
        url: canonical,
        description: serviceDescription,
      },
    ],
  };
};

const createAcquisitionRoute = (route) => ({
  ...route,
  shell: {
    label: route.label,
    h1: route.h1,
    intro: route.intro,
    sections: route.sections,
    links: route.links,
  },
  structuredData: buildAcquisitionStructuredData(route),
});

const acquisitionRoutes = [
  createAcquisitionRoute({
    path: '/amazon-lost-inventory-reimbursement',
    title: 'Amazon Lost Inventory Reimbursement | Margin',
    description:
      'Recover money tied to lost Amazon inventory. Margin identifies inventory discrepancies, organizes supporting evidence, manages claim preparation, and tracks reimbursement outcomes through resolution.',
    ogTitle: 'Amazon Lost Inventory Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers identify lost inventory discrepancies, organize evidence, prepare claims, and track reimbursement outcomes through resolution.',
    label: 'Amazon Lost Inventory Reimbursement',
    h1: 'Amazon Lost Inventory Reimbursement Without Chasing Cases',
    intro:
      'Margin helps sellers identify lost inventory discrepancies, organize supporting evidence, manage claim preparation, and track reimbursement outcomes through resolution.',
    sections: [
      {
        heading: 'What lost inventory reimbursement is',
        body:
          'Lost inventory reimbursement covers FBA units that are missing, adjusted, transferred, removed, or otherwise unresolved after Amazon inventory activity.',
        contextualSentence: [
          { type: 'text', text: 'For the broader operating model behind these cases, see ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: '.' },
        ],
      },
      {
        heading: 'Why inventory claims are missed',
        body:
          'Claims are missed when inventory signals, shipment records, seller documents, case timing, and payout outcomes live in different reports and workflows.',
      },
      {
        heading: 'Evidence required for inventory reimbursement',
        body:
          'Useful support can include inventory adjustments, reconciliation reports, inbound shipment details, invoices, reference IDs, case history, and settlement activity.',
      },
      {
        heading: 'How Margin tracks inventory recovery',
        body:
          'Margin connects detection, classification, evidence binding, seller approval, and outcome tracking so lost inventory work stays visible through resolution.',
        contextualSentence: [
          { type: 'text', text: 'Teams prioritizing recurring loss patterns often pair this with an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' view so inventory issues stay visible alongside other recovery categories.' },
        ],
      },
    ],
    links: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    faqs: [
      {
        question: 'What is Amazon lost inventory reimbursement?',
        answer:
          'Amazon lost inventory reimbursement is the process of recovering money for FBA units that Amazon cannot properly account for after receiving, storage, transfer, fulfillment, removal, or adjustment activity.',
      },
      {
        question: 'Why are lost inventory reimbursements often missed?',
        answer:
          'They are often missed because the inventory event, Amazon report trail, supporting seller records, and financial outcome are separated across different systems and time periods.',
      },
      {
        question: 'What evidence supports a lost inventory reimbursement claim?',
        answer:
          'Useful evidence can include inventory adjustment records, reconciliation reports, inbound shipment details, invoices, reference IDs, case history, and settlement or reimbursement activity.',
      },
      {
        question: 'Can Margin help track whether Amazon actually paid the reimbursement?',
        answer:
          'Yes. Margin is designed to keep recovery work visible through approval, rejection, dispute handling, reversal checks, and payout reconciliation.',
      },
      {
        question: 'Does Margin file lost inventory claims without seller approval?',
        answer:
          'No. Margin keeps seller review in the workflow. Sellers can review evidence and approve before filing action moves forward.',
      },
    ],
    serviceName: 'Amazon lost inventory reimbursement service',
    serviceType: 'Amazon lost inventory reimbursement workflow',
    softwareDescription:
      'Margin identifies Amazon lost inventory reimbursement opportunities, organizes supporting evidence, and tracks recovery outcomes through resolution.',
    serviceDescription:
      'Margin helps Amazon sellers manage lost inventory reimbursement workflows by connecting discrepancy detection, evidence organization, claim preparation, approval, and payout tracking.',
  }),
  createAcquisitionRoute({
    path: '/amazon-reimbursement-audit',
    title: 'Amazon Reimbursement Audit | Margin',
    description:
      'Identify reimbursement opportunities across inventory losses, shipment discrepancies, fee errors, and payout mismatches. Margin helps organize audit findings into actionable recovery workflows.',
    ogTitle: 'Amazon Reimbursement Audit | Margin',
    ogDescription:
      'Margin turns Amazon reimbursement audit findings across inventory, shipment, fee, and payout discrepancies into actionable recovery workflows.',
    label: 'Amazon Reimbursement Audit',
    h1: 'Amazon Reimbursement Audit For Sellers Who Need More Than Reports',
    intro:
      'Margin identifies reimbursement opportunities across inventory losses, shipment discrepancies, fee errors, and payout mismatches, then organizes audit findings into actionable recovery workflows.',
    sections: [
      {
        heading: 'What a reimbursement audit includes',
        body:
          'A reimbursement audit reviews seller account activity for inventory, shipment, refund, fee, reimbursement, and payout events that may not reconcile correctly.',
        contextualSentence: [
          { type: 'text', text: 'Sellers comparing the full category often start with ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' and then decide how audit coverage should be organized.' },
        ],
      },
      {
        heading: 'Common reimbursement categories',
        body:
          'Common categories include lost inventory, inbound shortages, refund gaps, fee overcharges, reimbursement reversals, and payout mismatches.',
        contextualSentence: [
          { type: 'text', text: 'That usually means breaking the work into ' },
          { type: 'link', href: '/amazon-lost-inventory-reimbursement', label: 'Amazon lost inventory reimbursement' },
          { type: 'text', text: ' and ' },
          { type: 'link', href: '/amazon-inbound-shipment-shortage', label: 'Amazon inbound shipment shortage recovery' },
          { type: 'text', text: ' paths before filing decisions are made.' },
        ],
      },
      {
        heading: 'Why audit reports alone are not enough',
        body:
          'A report only identifies possible issues. Sellers still need evidence, claim preparation, filing control, rejection handling, and payout reconciliation.',
      },
      {
        heading: "Margin's recovery workflow",
        body:
          'Margin turns audit signals into detect, classify, bind evidence, approve, and track outcome workflows so findings can move toward resolution.',
      },
    ],
    links: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    faqs: [
      {
        question: 'What is an Amazon reimbursement audit?',
        answer:
          'An Amazon reimbursement audit reviews seller account activity for inventory losses, shipment discrepancies, fee errors, refund gaps, reimbursement reversals, and payout mismatches that may create recovery opportunities.',
      },
      {
        question: 'What categories can an Amazon reimbursement audit review?',
        answer:
          'An audit can review lost inventory, inbound shipment shortages, refund-without-return activity, fee overcharges, measurement issues, reimbursement reversals, and settlement or payout discrepancies.',
      },
      {
        question: 'Why is an audit report not enough by itself?',
        answer:
          'A report only identifies possible issues. Sellers still need evidence, claim preparation, filing control, rejection handling, and payout reconciliation before the opportunity becomes resolved recovery work.',
      },
      {
        question: 'How does Margin turn audit findings into action?',
        answer:
          'Margin classifies reimbursement opportunities, organizes evidence, keeps seller approval in the workflow, supports filing preparation, and tracks outcomes through resolution.',
      },
      {
        question: 'Does Margin guarantee reimbursement after an audit?',
        answer:
          'No. Amazon controls the final reimbursement decision. Margin helps sellers find, organize, prepare, and track recovery opportunities more consistently.',
      },
    ],
    serviceName: 'Amazon reimbursement audit service',
    serviceType: 'Amazon reimbursement audit and recovery workflow',
    softwareDescription:
      'Margin identifies Amazon reimbursement audit opportunities and organizes findings into evidence-backed recovery workflows.',
    serviceDescription:
      'Margin helps Amazon sellers audit reimbursement opportunities across inventory losses, shipment discrepancies, fee errors, and payout mismatches, then manage findings through recovery workflows.',
  }),
  createAcquisitionRoute({
    path: '/amazon-inbound-shipment-shortage',
    title: 'Amazon Inbound Shipment Shortage Reimbursement | Margin',
    description:
      'Track inbound shipment shortages, organize shipment evidence, and monitor reimbursement eligibility before claim windows expire.',
    ogTitle: 'Amazon Inbound Shipment Shortage Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers track inbound shipment shortages, organize shipment evidence, and monitor reimbursement eligibility before claim windows expire.',
    label: 'Amazon Inbound Shipment Shortage',
    h1: 'Amazon Inbound Shipment Shortage Recovery',
    intro:
      'Margin helps sellers track inbound shipment shortages, organize shipment evidence, and monitor reimbursement eligibility before claim windows expire.',
    sections: [
      {
        heading: 'What inbound shortages are',
        body:
          'Inbound shortages happen when the quantity sent to FBA does not match what Amazon receives, recognizes, or reconciles.',
        contextualSentence: [
          { type: 'text', text: 'Inside the broader category, this sits under ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' with its own document and timing requirements.' },
        ],
      },
      {
        heading: 'Why shortages go unresolved',
        body:
          'Shortages go unresolved when shipment plans, carrier records, invoices, bills of lading, receiving reports, and case follow-up are hard to assemble manually.',
      },
      {
        heading: 'Required shipment documentation',
        body:
          'Useful documents can include shipment IDs, tracking records, box content details, bills of lading, invoices, packing lists, receiving records, and case history.',
      },
      {
        heading: "Margin's evidence workflow",
        body:
          'Margin groups shortage signals by shipment, binds supporting evidence, keeps seller approval in the loop, and tracks reimbursement outcomes.',
        contextualSentence: [
          { type: 'text', text: 'Sellers reviewing recurring receiving problems often connect this work back to an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' so shortage cases can be prioritized against the rest of the recovery queue.' },
        ],
      },
    ],
    links: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    faqs: [
      {
        question: 'What is an Amazon inbound shipment shortage?',
        answer:
          'An inbound shipment shortage occurs when the quantity a seller sends to FBA does not match the quantity Amazon receives, recognizes, or reconciles.',
      },
      {
        question: 'Why do inbound shipment shortages go unresolved?',
        answer:
          'They often go unresolved because shipment plans, carrier records, invoices, bills of lading, receiving reports, and case follow-up are difficult to assemble manually before timing windows weaken.',
      },
      {
        question: 'What documents support an inbound shortage claim?',
        answer:
          'Helpful documents can include shipment IDs, tracking records, box content details, bills of lading, invoices, packing lists, purchase orders, receiving records, and Amazon case history.',
      },
      {
        question: 'How does Margin help with inbound shipment shortages?',
        answer:
          'Margin detects shortage signals, classifies the recovery path, binds shipment evidence, keeps seller approval in the loop, and tracks the outcome through reimbursement resolution.',
      },
      {
        question: 'Does Margin submit inbound shortage claims without approval?',
        answer:
          'No. Margin keeps sellers in control with review and approval before filing action moves forward.',
      },
    ],
    serviceName: 'Amazon inbound shipment shortage reimbursement service',
    serviceType: 'Amazon inbound shipment shortage recovery workflow',
    softwareDescription:
      'Margin tracks Amazon inbound shipment shortages, organizes shipment evidence, and monitors reimbursement outcomes.',
    serviceDescription:
      'Margin helps Amazon sellers manage inbound shipment shortage reimbursement by organizing shipment records, evidence, approval, claim preparation, and payout tracking.',
  }),
  createAcquisitionRoute({
    path: '/amazon-fee-overcharge-reimbursement',
    title: 'Amazon Fee Overcharge Reimbursement | Margin',
    description:
      'Identify fee discrepancies, measurement errors, and overcharges. Margin helps structure evidence and recovery workflows around fee-related reimbursement opportunities.',
    ogTitle: 'Amazon Fee Overcharge Reimbursement | Margin',
    ogDescription:
      'Margin helps Amazon sellers identify fee discrepancies, measurement errors, and overcharge signals, then structure evidence and recovery workflows around them.',
    label: 'Amazon Fee Overcharge Reimbursement',
    h1: 'Amazon Fee Overcharge Recovery Without Manual Investigation',
    intro:
      'Margin helps sellers identify fee discrepancies, measurement errors, and overcharges, then structure evidence and recovery workflows around fee-related reimbursement opportunities.',
    sections: [
      {
        heading: 'Fee overcharges explained',
        body:
          'Fee overcharge reimbursement focuses on fees that appear inconsistent with product measurements, transaction context, storage activity, or settlement records.',
        contextualSentence: [
          { type: 'text', text: 'It is one branch of the wider ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' workflow, but it depends on its own validation trail.' },
        ],
      },
      {
        heading: 'Common fee discrepancy scenarios',
        body:
          'Scenarios can include measurement errors, storage charges, fulfillment fee changes, category logic, reimbursement reversals, and settlement mismatches.',
        contextualSentence: [
          { type: 'text', text: 'When these issues repeat across the account, an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' helps keep fee recovery aligned with inventory, shipment, and payout findings.' },
        ],
      },
      {
        heading: 'Evidence and validation requirements',
        body:
          'Useful support can include catalog records, SKU details, dimensions, weight, fee previews, transaction reports, settlement records, and case history.',
      },
      {
        heading: 'Recovery workflow',
        body:
          'Margin ties fee discrepancy detection, classification, validation evidence, seller approval, and payout tracking into one recovery workflow.',
      },
    ],
    links: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    faqs: [
      {
        question: 'What is Amazon fee overcharge reimbursement?',
        answer:
          'Amazon fee overcharge reimbursement is the process of recovering money when Amazon fee charges appear inconsistent with product measurements, transaction context, storage activity, or settlement records.',
      },
      {
        question: 'What fee issues can Margin help identify?',
        answer:
          'Margin can help identify fee discrepancies tied to measurement errors, fulfillment fees, storage fees, settlement mismatches, reimbursement reversals, and overcharge patterns that need evidence review.',
      },
      {
        question: 'What evidence is useful for fee overcharge recovery?',
        answer:
          'Useful evidence can include catalog records, SKU details, dimensions, weight, fee previews, transaction reports, settlement records, support history, and reimbursement activity.',
      },
      {
        question: 'How does Margin handle fee-related recovery workflow?',
        answer:
          'Margin detects the discrepancy, classifies the issue, organizes validation evidence, keeps seller approval in the workflow, and tracks the outcome through adjustment or reimbursement resolution.',
      },
      {
        question: 'Does Margin guarantee Amazon will adjust a fee?',
        answer:
          'No. Amazon controls fee review and reimbursement decisions. Margin helps sellers structure the evidence and workflow around fee-related recovery opportunities.',
      },
    ],
    serviceName: 'Amazon fee overcharge reimbursement service',
    serviceType: 'Amazon fee overcharge recovery workflow',
    softwareDescription:
      'Margin identifies Amazon fee overcharge reimbursement opportunities, organizes validation evidence, and tracks fee recovery outcomes.',
    serviceDescription:
      'Margin helps Amazon sellers structure fee discrepancy recovery workflows around detection, evidence organization, claim preparation, approval, and payout tracking.',
  }),
];

const getidaAlternativeRoute = createAcquisitionRoute({
  path: '/getida-alternative',
  title: 'GETIDA Alternative | Margin',
  description:
    'Compare GETIDA and Margin. Learn how Amazon reimbursement workflows differ, from discrepancy detection through evidence collection, filing, disputes, and payout reconciliation.',
  ogTitle: 'GETIDA Alternative | Margin',
  ogDescription:
    'Compare GETIDA and Margin workflow differences across discrepancy detection, evidence collection, filing, disputes, and payout reconciliation.',
  label: 'GETIDA Alternative',
  h1: 'Looking For A GETIDA Alternative?',
  intro:
    'Most Amazon reimbursement platforms help identify discrepancies. The operational work begins after that. Margin is designed for sellers who want support beyond detection, including evidence preparation, filing workflows, dispute handling, and payout reconciliation.',
  sections: [
    {
      heading: 'Workflow comparison',
      body:
        'This comparison stays focused on workflow questions. It does not assert unverified GETIDA capabilities. Where a workflow detail cannot be verified from public information, it is labeled: Public information not verified.',
      contextualSentence: [
        { type: 'text', text: 'Sellers who want category context first can start with ' },
        { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
        { type: 'text', text: ', then compare how a ' },
        { type: 'link', href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
        { type: 'text', text: ' frames post-detection workflow questions.' },
      ],
    },
    {
      heading: 'What Happens After Detection Matters',
      body:
        'Many reimbursement discussions focus on finding discrepancies. Sellers still need to locate evidence, prepare documentation, handle rejections, track outcomes, and reconcile payouts.',
      contextualSentence: [
        { type: 'text', text: 'That same post-detection burden is why many teams widen the lens to an ' },
        { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
        { type: 'text', text: ' before deciding which claims deserve workflow attention first.' },
      ],
    },
    {
      heading: 'How Margin approaches the workflow',
      body:
        'Margin uses Detect, Classify, Bind Evidence, Approve, and Track Outcome to keep reimbursement work connected from discrepancy discovery through payout reconciliation.',
    },
    {
      heading: 'Trust controls',
      body:
        'Margin starts with a read-only first workflow, keeps seller approval before filing, and is designed around no unauthorized account actions.',
    },
  ],
  links: [
    { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
    { href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
    { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    { href: '/pricing', label: 'View pricing' },
  ],
  faqs: [
    {
      question: 'What should I look for in a GETIDA alternative?',
      answer:
        'Look for clarity around the full reimbursement workflow, including evidence preparation, claim readiness, filing control, rejection follow-up, dispute handling, payout reconciliation, and seller approval before action.',
    },
    {
      question: 'How does Margin differ from reimbursement reporting tools?',
      answer:
        'Margin is designed as a recovery workflow, not only a report of possible discrepancies. The workflow moves through Detect, Classify, Bind Evidence, Approve, and Track Outcome.',
    },
    {
      question: 'Does Margin guarantee reimbursements?',
      answer:
        'No. Amazon controls reimbursement decisions. Margin helps sellers identify opportunities, organize evidence, prepare claim workflows, manage follow-up, and track outcomes.',
    },
    {
      question: 'Can I review cases before filing?',
      answer:
        'Yes. Margin is designed with seller approval before filing so sellers can review cases before filing action moves forward.',
    },
    {
      question: 'What happens after a reimbursement claim is submitted?',
      answer:
        'After submission, the work can continue through replies, document requests, rejections, low offers, dispute handling, approval, reversal checks, and payout reconciliation.',
    },
  ],
  serviceName: 'GETIDA alternative reimbursement workflow',
  serviceType: 'Amazon reimbursement workflow software',
  softwareDescription:
    'Margin helps Amazon sellers manage reimbursement workflows from discrepancy detection through evidence preparation, approval, filing, disputes, and payout reconciliation.',
  serviceDescription:
    'Margin helps Amazon sellers evaluate a GETIDA alternative focused on reimbursement workflow stages, including evidence preparation, seller approval, filing, disputes, and payout reconciliation.',
});

const sellerboardAlternativeRoute = createAcquisitionRoute({
  path: '/sellerboard-alternative',
  title: 'Sellerboard Alternative | Margin',
  description:
    'Compare Sellerboard and Margin. Learn how reimbursement workflows differ from discrepancy detection through evidence collection, filing, dispute handling, and payout reconciliation.',
  ogTitle: 'Sellerboard Alternative | Margin',
  ogDescription:
    'Compare Sellerboard and Margin workflow differences across discrepancy detection, evidence collection, filing support, dispute handling, and payout reconciliation.',
  label: 'Sellerboard Alternative',
  h1: 'Looking For A Sellerboard Alternative?',
  intro:
    'Many Amazon sellers use software to monitor profitability and identify reimbursement opportunities. The operational work begins after a discrepancy is identified. Margin is designed to support the workflow that follows, including evidence preparation, filing support, dispute handling, and payout reconciliation.',
  sections: [
    {
      heading: 'Workflow comparison',
      body:
        'This comparison stays focused on workflow questions. It does not assert unverified Sellerboard capabilities. Where a workflow detail cannot be verified from public information, it is labeled: Public information not verified.',
      contextualSentence: [
        { type: 'text', text: 'Sellers who want the category view before comparisons can start with ' },
        { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
        { type: 'text', text: ', then contrast that with the workflow framing on the ' },
        { type: 'link', href: '/getida-alternative', label: 'GETIDA alternative' },
        { type: 'text', text: ' page.' },
      ],
    },
    {
      heading: 'Finding A Discrepancy Is Only The Beginning',
      body:
        'The operational burden often comes after detection: locating documents, validating evidence, preparing claims, handling rejections, tracking outcomes, and reconciling payments.',
      contextualSentence: [
        { type: 'text', text: 'Teams that need to prioritize that work across claim types often back up into an ' },
        { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
        { type: 'text', text: ' so post-detection effort is organized before filing begins.' },
      ],
    },
    {
      heading: 'How Margin approaches the workflow',
      body:
        'Margin uses Detect, Classify, Bind Evidence, Approve, and Track Outcome to keep reimbursement work connected from discrepancy discovery through payout reconciliation.',
    },
    {
      heading: 'Trust controls',
      body:
        'Margin starts with a read-only first workflow, keeps seller approval before filing, and is designed around no unauthorized account actions.',
    },
  ],
  links: [
    { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
    { href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
    { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    { href: '/pricing', label: 'View pricing' },
    { href: '/getida-alternative', label: 'GETIDA alternative' },
  ],
  faqs: [
    {
      question: 'What should I look for in a Sellerboard alternative?',
      answer:
        'Look for clarity around the full reimbursement workflow, including evidence preparation, claim readiness, filing support, rejection follow-up, dispute handling, payout reconciliation, and seller approval before action.',
    },
    {
      question: 'How does Margin differ from reimbursement reporting tools?',
      answer:
        'Margin is designed as a recovery workflow, not only a view of possible discrepancies. The workflow moves through Detect, Classify, Bind Evidence, Approve, and Track Outcome.',
    },
    {
      question: 'Does Margin guarantee reimbursements?',
      answer:
        'No. Amazon controls reimbursement decisions. Margin helps sellers identify opportunities, organize evidence, prepare claim workflows, manage follow-up, and track outcomes.',
    },
    {
      question: 'Can I review cases before filing?',
      answer:
        'Yes. Margin is designed with seller approval before filing so sellers can review cases before filing action moves forward.',
    },
    {
      question: 'What happens after a reimbursement claim is submitted?',
      answer:
        'After submission, the work can continue through replies, document requests, rejections, low offers, dispute handling, approval, reversal checks, and payout reconciliation.',
    },
  ],
  serviceName: 'Sellerboard alternative reimbursement workflow',
  serviceType: 'Amazon reimbursement workflow software',
  softwareDescription:
    'Margin helps Amazon sellers manage reimbursement workflows from discrepancy detection through evidence preparation, approval, filing support, disputes, and payout reconciliation.',
  serviceDescription:
    'Margin helps Amazon sellers evaluate a Sellerboard alternative focused on reimbursement workflow stages, including evidence preparation, seller approval, filing support, disputes, and payout reconciliation.',
});

const routes = [
  {
    path: '/',
    title: 'Margin | Amazon FBA Recovery and Payout Visibility',
    description:
      'For Amazon FBA sellers with an unresolved recovery or recurring recovery work, Margin shows what is supported, keeps seller-approved recovery work moving, and distinguishes what was approved from what was paid.',
    ogTitle: 'Margin | Amazon FBA Recovery and Payout Visibility',
    ogDescription:
      'For Amazon FBA sellers with an unresolved recovery or recurring recovery work: see what is supported, approve the work that moves forward, and understand the payout outcome.',
    shell: {
      label: 'Amazon FBA revenue recovery & reconciliation',
      h1: 'Find what Amazon missed. Get it handled. Know it was paid.',
      intro:
        'Margin keeps your FBA recovery work together—from understanding what happened and proving it, to handling what you approve and showing what Amazon actually paid.',
      sections: [
        {
          heading: 'What the free Recovery Audit shows',
          body:
            'The Audit shows what was found, what supports it, what needs a seller decision, and what happened to the money before any paid work is considered.',
        },
        {
          heading: 'How sellers stay in control',
          body:
            'Sellers start with read-only access, see the source coverage and proof behind a result, and approve a recovery before anything moves forward. Expected, approved, paid, reversed, and unresolved outcomes remain distinct.',
        },
      ],
    },
  },
  {
    path: '/pricing',
    title: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    description:
      'Keep your approved recoveries. Pay for the system, not a percentage of every reimbursement. Choose the tier that fits your operational scale.',
    ogTitle: 'Margin Pricing | Evidence-Ready Amazon Reimbursement Workflows',
    ogDescription:
      'Keep your approved recoveries with Margin pricing built around recovery management, evidence workflow, and seller-controlled filing.',
    shell: {
      label: 'Tiered Revenue Recovery Infrastructure',
      h1: 'Pricing',
      intro:
        'Margin pricing is built around recovery management, evidence workflow, seller approval before filing, and payout visibility. The pricing page explains the platform tiers and keeps the model focused on software access instead of taking a percentage of approved reimbursements.',
      sections: [
        {
          heading: 'How pricing is framed',
          body:
            'The page positions pricing around operational scale, workflow coverage, and billing readiness. It keeps the offer tied to the recovery system rather than contingency-style recovery commissions.',
        },
      ],
    },
  },
  {
    path: '/amazon-fba-reimbursement',
    title: 'Amazon FBA Reimbursement Service | Margin',
    description:
      'Recover money Amazon owes your business. Margin identifies reimbursement opportunities, organizes evidence, manages claim filing, handles disputes, and tracks payouts through resolution.',
    ogTitle: 'Amazon FBA Reimbursement Service | Margin',
    ogDescription:
      'Margin helps Amazon sellers recover money by identifying FBA reimbursement issues, organizing evidence, managing filing, handling disputes, and reconciling payouts.',
    shell: {
      label: 'Amazon FBA Reimbursement',
      h1: 'Amazon FBA Reimbursement Without The Manual Work',
      intro:
        'Most reimbursement tools stop at detection. Margin continues through evidence collection, filing, rejection handling, lowball dispute handling, and payout reconciliation so recovery work stays operational until the outcome is actually resolved.',
      sections: [
        {
          heading: 'What Amazon FBA reimbursement includes',
          body:
            'Margin helps sellers work through lost inventory, inbound shortages, refund-without-return activity, fee overcharges, and payout discrepancies. These issues often surface after valuable time has already passed.',
          contextualSentence: [
            { type: 'text', text: 'Those recovery paths often branch into ' },
            { type: 'link', href: '/amazon-lost-inventory-reimbursement', label: 'Amazon lost inventory reimbursement' },
            { type: 'text', text: ', ' },
            { type: 'link', href: '/amazon-inbound-shipment-shortage', label: 'Amazon inbound shipment shortage recovery' },
            { type: 'text', text: ', and ' },
            { type: 'link', href: '/amazon-fee-overcharge-reimbursement', label: 'Amazon fee overcharge recovery' },
            { type: 'text', text: ' work, each with different evidence and timing requirements.' },
          ],
        },
        {
          heading: 'How Margin approaches recovery',
          body:
            'The workflow moves through detect, classify, bind evidence, approve, and track outcome. That keeps each reimbursement issue tied to evidence quality, filing control, dispute handling, and payout truth.',
          contextualSentence: [
            { type: 'text', text: 'That is also why sellers often look at an ' },
            { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
            { type: 'text', text: ' before deciding how findings should move through the rest of the workflow.' },
          ],
        },
        {
          heading: 'How sellers compare operating models',
          body:
            'Workflow evaluation often continues after the category page, especially when sellers want to compare how different operating models handle recovery after detection.',
          contextualSentence: [
            { type: 'text', text: 'For that comparison layer, review the ' },
            { type: 'link', href: '/getida-alternative', label: 'GETIDA alternative' },
            { type: 'text', text: ' and ' },
            { type: 'link', href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
            { type: 'text', text: ' pages.' },
          ],
        },
      ],
      links: [
        { href: '/pricing', label: 'View pricing' },
        { href: '/pricing', label: 'View pricing' },
        { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
      ],
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          '@id': 'https://margin-finance.com/amazon-fba-reimbursement#faq',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is Amazon FBA reimbursement?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Amazon FBA reimbursement is the process of recovering money Amazon may owe when inventory, fees, refunds, or settlement activity do not reconcile correctly.',
              },
            },
            {
              '@type': 'Question',
              name: 'How long do Amazon reimbursement claims take?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Claim timing varies by claim type, evidence quality, and the current Amazon case path. Some cases move quickly, while others require follow-up, dispute handling, or payout reconciliation before they are resolved.',
              },
            },
            {
              '@type': 'Question',
              name: 'What types of reimbursement issues can Margin help identify?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Margin helps identify lost inventory, inbound shortages, refund-without-return cases, fee overcharges, reimbursement reversals, and payout discrepancies.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does Margin guarantee reimbursement?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Margin does not guarantee reimbursement outcomes. Amazon makes the final reimbursement decision.',
              },
            },
            {
              '@type': 'Question',
              name: 'Does Margin access my Amazon account without approval?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Margin starts read-only. Sellers review evidence before action and approve before filing.',
              },
            },
          ],
        },
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://margin-finance.com/amazon-fba-reimbursement#software',
          name: 'Margin',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://margin-finance.com/amazon-fba-reimbursement',
          description:
            'Margin identifies Amazon FBA reimbursement opportunities, organizes evidence, manages filing workflow, handles disputes, and tracks payouts through resolution.',
          offers: {
            '@type': 'Offer',
            price: '99',
            priceCurrency: 'USD',
            description: 'Early access activation for Margin recovery workflow',
          },
        },
        {
          '@type': 'Service',
          '@id': 'https://margin-finance.com/amazon-fba-reimbursement#service',
          name: 'Amazon FBA reimbursement service',
          serviceType: 'Amazon FBA reimbursement management',
          provider: {
            '@type': 'Organization',
            name: 'Margin',
            url: 'https://margin-finance.com/',
          },
          areaServed: 'Worldwide',
          url: 'https://margin-finance.com/amazon-fba-reimbursement',
          description:
            'Margin helps Amazon sellers recover money by identifying reimbursement issues, binding evidence, managing filing workflow, handling disputes, and reconciling payouts.',
        },
      ],
    },
  },
  ...acquisitionRoutes,
  getidaAlternativeRoute,
  sellerboardAlternativeRoute,
  {
    path: '/research',
    title: 'FBA Reimbursement Research | Margin',
    description:
      'How Amazon sellers evaluate FBA reimbursement software, audit services, documentation, filing workflow, eligibility, deadlines, and payout tracking.',
    ogTitle: 'FBA Reimbursement Research | Margin',
    ogDescription:
      'A research hub for comparing FBA reimbursement tools, audit services, evidence workflows, filing control, and payout tracking.',
    shell: {
      label: 'Research Hub',
      h1: 'A practical guide to evaluating FBA reimbursement software, audit services, and recovery workflow quality.',
      intro:
        'This research page explains how Amazon sellers compare FBA reimbursement software, audit services, and workflow systems. It covers detection depth, evidence handling, filing control, deadlines, payout tracking, and the difference between a spreadsheet of findings and an actual recovery workflow.',
      sections: [
        {
          heading: 'What sellers are actually buying',
          body:
            'The page focuses on the operational burden behind recoveries: identifying recoverable Amazon events, validating claim eligibility, assembling evidence, controlling submissions, and tracking payouts through completion.',
          contextualSentence: [
            { type: 'text', text: 'For the main commercial category page, see ' },
            { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
            { type: 'text', text: ', where the same workflow is framed around seller intent rather than evaluation criteria.' },
          ],
        },
        {
          heading: 'How to compare tools and services',
          body:
            'The comparison framework looks at whether a product is a tracker, an audit service, or a broader recovery platform, and whether it improves evidence quality, filing control, and recovery-state visibility.',
          contextualSentence: [
            { type: 'text', text: 'Comparison traffic usually enters through pages like ' },
            { type: 'link', href: '/getida-alternative', label: 'GETIDA alternative' },
            { type: 'text', text: ' and ' },
            { type: 'link', href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
            { type: 'text', text: ', where those workflow questions are kept grounded in public information.' },
          ],
        },
        {
          heading: 'Eligibility and deadlines',
          body:
            'Timing pressure, evidence strength, and live-case state all affect whether a discrepancy is actually recoverable, not just numerically interesting.',
          contextualSentence: [
            { type: 'text', text: 'Eligibility pressure is especially visible on ' },
            { type: 'link', href: '/amazon-lost-inventory-reimbursement', label: 'Amazon lost inventory reimbursement' },
            { type: 'text', text: ' work, where aged events can quickly weaken the evidence trail.' },
          ],
        },
        {
          heading: 'Documentation and evidence',
          body:
            'The research makes evidence quality central because shipment records, product records, case history, and payout context all shape whether the claim path can move.',
          contextualSentence: [
            { type: 'text', text: 'Shipment-heavy evidence questions are clearest on ' },
            { type: 'link', href: '/amazon-inbound-shipment-shortage', label: 'Amazon inbound shipment shortage recovery' },
            { type: 'text', text: ', where document completeness often decides whether the claim path can move.' },
          ],
        },
        {
          heading: 'Filing control and denials',
          body:
            'The filing layer is where weak evidence, duplicate case paths, timing failures, and unsupported value calculations become operational problems.',
          contextualSentence: [
            { type: 'text', text: 'When teams need one view across filing risk, denials, and queue priority, an ' },
            { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
            { type: 'text', text: ' often becomes the organizing layer.' },
          ],
        },
        {
          heading: 'Tracking and financial truth',
          body:
            'Visibility after filing matters because approvals, holds, reversals, and payout truth are not the same state and should not be treated as interchangeable.',
          contextualSentence: [
            { type: 'text', text: 'That same tracking discipline matters on ' },
            { type: 'link', href: '/amazon-fee-overcharge-reimbursement', label: 'Amazon fee overcharge recovery' },
            { type: 'text', text: ', where payout truth can drift away from the original charge story.' },
          ],
        },
      ],
      links: [
        { href: '/getida-alternative', label: 'GETIDA alternative' },
        { href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
        { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
        { href: '/pricing', label: 'View pricing' },
      ],
    },
  },
  {
    path: '/fba-reimbursement-research',
    title: 'Amazon FBA Reimbursement Research | Margin',
    description:
      'Research for Amazon sellers comparing FBA reimbursement software, audit workflows, claim eligibility, evidence documentation, and recovery tracking.',
    ogTitle: 'Amazon FBA Reimbursement Research | Margin',
    ogDescription:
      'Compare Amazon FBA reimbursement workflows by detection depth, evidence quality, filing control, deadlines, and payout visibility.',
    shell: {
      label: 'Research Hub',
      h1: 'A practical guide to evaluating FBA reimbursement software, audit services, and recovery workflow quality.',
      intro:
        'This route serves the same research component as /research and is prerendered with its own canonical, Open Graph URL, and route-specific metadata. It gives Amazon sellers a structured way to compare FBA reimbursement software, audit workflows, evidence requirements, and recovery tracking.',
      sections: [
        {
          heading: 'What this page covers',
          body:
            'The research compares reimbursement tools and services based on how they detect opportunities, document evidence, support seller review, and keep visibility into approvals, reversals, and payouts.',
          contextualSentence: [
            { type: 'text', text: 'For the main commercial category page, see ' },
            { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
            { type: 'text', text: ', where the same workflow is framed around seller intent rather than evaluation criteria.' },
          ],
        },
        {
          heading: 'Comparison pages',
          body:
            'Competitive evaluation works best when workflow differences are kept factual and tied to public information rather than exaggerated feature claims.',
          contextualSentence: [
            { type: 'text', text: 'Comparison traffic usually enters through pages like ' },
            { type: 'link', href: '/getida-alternative', label: 'GETIDA alternative' },
            { type: 'text', text: ' and ' },
            { type: 'link', href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
            { type: 'text', text: ', where those workflow questions are kept grounded in public information.' },
          ],
        },
        {
          heading: 'Eligibility and deadlines',
          body:
            'Timing pressure, evidence strength, and live-case state all affect whether a discrepancy is actually recoverable, not just numerically interesting.',
          contextualSentence: [
            { type: 'text', text: 'Eligibility pressure is especially visible on ' },
            { type: 'link', href: '/amazon-lost-inventory-reimbursement', label: 'Amazon lost inventory reimbursement' },
            { type: 'text', text: ' work, where aged events can quickly weaken the evidence trail.' },
          ],
        },
        {
          heading: 'Documentation and evidence',
          body:
            'The research makes evidence quality central because shipment records, product records, case history, and payout context all shape whether the claim path can move.',
          contextualSentence: [
            { type: 'text', text: 'Shipment-heavy evidence questions are clearest on ' },
            { type: 'link', href: '/amazon-inbound-shipment-shortage', label: 'Amazon inbound shipment shortage recovery' },
            { type: 'text', text: ', where document completeness often decides whether the claim path can move.' },
          ],
        },
        {
          heading: 'Filing control and denials',
          body:
            'The filing layer is where weak evidence, duplicate case paths, timing failures, and unsupported value calculations become operational problems.',
          contextualSentence: [
            { type: 'text', text: 'When teams need one view across filing risk, denials, and queue priority, an ' },
            { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
            { type: 'text', text: ' often becomes the organizing layer.' },
          ],
        },
        {
          heading: 'Tracking and financial truth',
          body:
            'Visibility after filing matters because approvals, holds, reversals, and payout truth are not the same state and should not be treated as interchangeable.',
          contextualSentence: [
            { type: 'text', text: 'That same tracking discipline matters on ' },
            { type: 'link', href: '/amazon-fee-overcharge-reimbursement', label: 'Amazon fee overcharge recovery' },
            { type: 'text', text: ', where payout truth can drift away from the original charge story.' },
          ],
        },
      ],
      links: [
        { href: '/getida-alternative', label: 'GETIDA alternative' },
        { href: '/sellerboard-alternative', label: 'Sellerboard alternative' },
        { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
        { href: '/pricing', label: 'View pricing' },
      ],
    },
  },
  {
    path: '/about-margin',
    title: 'About Margin | Operating System for FBA Recovery',
    description:
      'Margin is building an operating system for Amazon FBA recovery: detection, evidence collection, filing readiness, and payout tracking in one continuous workflow.',
    ogTitle: 'About Margin | Operating System for FBA Recovery',
    ogDescription:
      'Learn how Margin connects Amazon FBA recovery detection, evidence collection, filing readiness, and payout tracking in one workflow.',
    shell: {
      label: 'About Margin',
      h1: 'Margin is being built as the operating system for Amazon FBA recovery.',
      intro:
        'The about page explains Margin as a workflow system for Amazon FBA recovery, connecting detection, evidence collection, filing readiness, seller control, and payout tracking in one coordinated process.',
      sections: [
        {
          heading: 'System model',
          body:
            'Recovery work becomes useful when event detection, evidence, filing control, and payout truth stay connected. Margin frames that work as an operating system instead of a disconnected set of audits and spreadsheets.',
        },
      ],
    },
  },
  {
    path: '/contact',
    title: 'Contact Support | Margin',
    description:
      'Contact Margin for support, onboarding, billing, API access, or recovery workflow questions.',
    ogTitle: 'Contact Support | Margin',
    ogDescription:
      'Reach the Margin team for onboarding, support, billing, API access, and Amazon recovery workflow questions.',
    shell: {
      label: 'Support',
      h1: 'Tell us where the workflow is stuck.',
      intro:
        'The contact page routes support, onboarding, billing, API, and recovery workflow questions to the Margin team. It is built around a support intake flow rather than a generic marketing form.',
      sections: [
        {
          heading: 'What this route is for',
          body:
            'Use this route to reach Margin about setup issues, billing questions, workflow blockers, and support requests tied to Amazon recovery operations.',
        },
      ],
    },
  },
  {
    path: '/sales',
    title: 'Institutional Inquiry | Margin',
    description:
      'Connect with the Margin team for high-velocity seller solutions and strategic inventory arbitrage.',
    ogTitle: 'Institutional Inquiry | Margin',
    ogDescription:
      'Talk with Margin about high-velocity seller recovery workflows, multi-marketplace operations, and strategic inventory recovery infrastructure.',
    shell: {
      label: 'Institutional Inquiry',
      h1: 'Scale Autonomously with Margin Enterprise',
      intro:
        'The sales page is aimed at enterprise and institutional operators evaluating Margin for higher-volume recovery workflows, multi-marketplace operations, and larger catalog complexity.',
      sections: [
        {
          heading: 'Who this page speaks to',
          body:
            'The route frames Margin around enterprise operational requirements, including scale, workflow coordination, and recovery infrastructure for larger seller organizations.',
        },
      ],
    },
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Margin',
    description: "Privacy Policy for Margin's automated FBA auditing platform.",
    ogTitle: 'Privacy Policy | Margin',
    ogDescription:
      'Read the Margin privacy policy for Amazon FBA recovery workflows, connected data, and platform operations.',
    shell: {
      label: 'Policy',
      h1: 'Privacy Policy',
      intro:
        'This policy page describes how Margin handles data connected to its Amazon FBA recovery and auditing platform, including collection, use, and operational safeguards.',
      sections: [
        {
          heading: 'Policy scope',
          body:
            'The page covers the data definitions, collection points, operational usage, and privacy practices relevant to connected seller workflows and platform operations.',
        },
      ],
    },
  },
  {
    path: '/terms',
    title: 'Terms of Service | Margin',
    description: "Terms of Service governing use of Margin's automated FBA auditing platform.",
    ogTitle: 'Terms of Service | Margin',
    ogDescription:
      'Review the Margin terms of service for use of the Amazon FBA recovery and auditing platform.',
    shell: {
      label: 'Policy',
      h1: 'Terms of Service',
      intro:
        'This route contains the terms governing use of the Margin platform and sets the service relationship around Amazon FBA recovery and auditing workflows.',
      sections: [
        {
          heading: 'What the terms cover',
          body:
            'The terms page outlines core service conditions, customer responsibilities, platform usage boundaries, and the contractual framework for using Margin.',
        },
      ],
    },
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy | Margin',
    description:
      'Review our refund and cancellation policy for the Margin FBA reimbursement platform.',
    ogTitle: 'Refund Policy | Margin',
    ogDescription:
      'Review Margin refund and cancellation terms for FBA reimbursement workflows and platform access.',
    shell: {
      label: 'Policy',
      h1: 'Refund and Cancellation Policy',
      intro:
        'This route explains the refund and cancellation policy for the Margin platform and how billing expectations relate to access to the FBA reimbursement workflow system.',
      sections: [
        {
          heading: 'What this policy addresses',
          body:
            'The policy page defines pricing-model expectations, cancellation handling, and the refund boundaries for platform access and related services.',
        },
      ],
    },
  },
];

const htmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const routeUrl = (routePath) => `${siteUrl}${routePath === '/' ? '/' : routePath}`;

const renderInlineSegments = (segments = []) =>
  segments
    .map((segment) =>
      segment.type === 'link'
        ? `<a href="${htmlEscape(segment.href)}">${htmlEscape(segment.label)}</a>`
        : htmlEscape(segment.text)
    )
    .join('');

const replaceOrInsert = (html, pattern, replacement, before = '</head>') => {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(before, `  ${replacement}\n${before}`);
};

const renderLinks = (route) => {
  const links = route.shell?.links || (
    route.path === '/'
      ? [
          { href: '/pricing', label: 'View pricing' },
          { href: '/pricing', label: 'View pricing' },
        ]
      : [
          { href: '/', label: 'Return to Margin homepage' },
          { href: '/pricing', label: 'View pricing' },
        ]
  );

  return `        <p>
${links.map((link, index) => `          <a href="${htmlEscape(link.href)}">${htmlEscape(link.label)}</a>${index < links.length - 1 ? ' ·' : ''}`).join('\n')}
        </p>`;
};

const renderLoadingRoot = () => `  <div id="root">
    <main class="route-loading-shell" aria-label="Margin loading">
      <div class="route-loading-shell__brand">
        <img src="/logoimagetwo.png" alt="Margin" width="28" height="28" />
        <span>Margin</span>
      </div>
    </main>
  </div>`;

const renderShell = (route) => {
  const sections = (route.shell?.sections || [])
    .map(
      (section) => `        <section>
          <h2>${htmlEscape(section.heading)}</h2>
          <p>${htmlEscape(section.body)}</p>
${section.contextualSentence ? `          <p>${renderInlineSegments(section.contextualSentence)}</p>` : ''}
        </section>`
    )
    .join('\n');

  return `  <div id="root">
    <main class="seo-shell" aria-label="${htmlEscape(route.title)}">
      <div class="seo-shell__inner">
        <div class="seo-shell__brand">
          <img src="/logoimagetwo.png" alt="Margin" width="28" height="28" />
          <span>Margin</span>
        </div>
        <div class="seo-shell__hero">
          <p class="seo-shell__eyebrow"><strong>${htmlEscape(route.shell?.label || 'Margin')}</strong></p>
          <h1>${htmlEscape(route.shell?.h1 || route.title)}</h1>
          <p>${htmlEscape(route.shell?.intro || route.description)}</p>
        </div>
${sections}
${renderLinks(route)}
      </div>
    </main>
  </div>`;
};

const replaceStructuredData = (html, data) => {
  if (!data) return html;

  const replacement = `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;

  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, replacement);
  }

  return html.replace('</head>', `  ${replacement}\n</head>`);
};

const applyMeta = (html, route) => {
  const canonical = routeUrl(route.path);
  const image = route.image || defaultImage;
  const robots = route.robots || 'index, follow, max-image-preview:large';

  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${htmlEscape(route.title)}</title>`);

  next = replaceOrInsert(
    next,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${htmlEscape(route.description)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${htmlEscape(robots)}" />`
  );
  next = replaceOrInsert(
    next,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${htmlEscape(canonical)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${htmlEscape(route.ogTitle)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${htmlEscape(route.ogDescription)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${htmlEscape(canonical)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+property=["']og:image["'][^>]*>/i,
    `<meta property="og:image" content="${htmlEscape(image)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${htmlEscape(route.ogTitle)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${htmlEscape(route.ogDescription)}" />`
  );
  next = replaceOrInsert(
    next,
    /<meta\s+name=["']twitter:image["'][^>]*>/i,
    `<meta name="twitter:image" content="${htmlEscape(image)}" />`
  );
  next = replaceStructuredData(next, route.structuredData);

  const rootMarkup = renderLoadingRoot();

  next = next.replace(/<div id="root">[\s\S]*?<\/div>\s*<script>/i, `${rootMarkup}\n  <script>`);

  return next;
};

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot prerender public routes: ${indexPath} does not exist.`);
}

const template = fs.readFileSync(indexPath, 'utf8');

for (const route of routes) {
  const html = applyMeta(template, route);
  const outputPath = route.path === '/'
    ? indexPath
    : path.join(distDir, route.path.slice(1), 'index.html');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
}

console.log(`Prerendered ${routes.length} public SEO routes.`);
