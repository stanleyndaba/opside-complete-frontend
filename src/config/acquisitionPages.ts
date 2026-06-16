import type { RouteMeta } from './seo';

export type AcquisitionFaq = {
  question: string;
  answer: string;
};

export type AcquisitionInlineSegment =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'link';
      href: string;
      label: string;
    };

export type AcquisitionSection = {
  eyebrow: string;
  heading: string;
  body: string;
  contextualSentence?: AcquisitionInlineSegment[];
  points: Array<{
    label: string;
    detail: string;
  }>;
};

export type AcquisitionPageData = {
  path: string;
  label: string;
  h1: string;
  heroIntro: string;
  heroPoints: string[];
  sections: AcquisitionSection[];
  workflowHeading: string;
  workflowBody: string;
  workflowSteps: Array<{
    step: string;
    title: string;
    detail: string;
  }>;
  faqs: AcquisitionFaq[];
  internalLinks: Array<{
    href: string;
    label: string;
  }>;
  serviceName: string;
  serviceType: string;
  softwareDescription: string;
  serviceDescription: string;
};

const sharedWorkflow = [
  {
    step: '01',
    title: 'Detect',
    detail: 'Amazon activity is converted into explicit recovery signals instead of staying scattered across reports.',
  },
  {
    step: '02',
    title: 'Classify',
    detail: 'Each signal is mapped to the reimbursement category, timing logic, and evidence path that applies.',
  },
  {
    step: '03',
    title: 'Bind Evidence',
    detail: 'Supporting records are attached to the recovery event before the case is treated as claim-ready.',
  },
  {
    step: '04',
    title: 'Approve',
    detail: 'Seller review stays in the loop before any filing action happens.',
  },
  {
    step: '05',
    title: 'Track Outcome',
    detail: 'The workflow keeps visibility through follow-up, dispute handling, approval, and payout reconciliation.',
  },
];

export const acquisitionPages: Record<string, AcquisitionPageData> = {
  '/amazon-lost-inventory-reimbursement': {
    path: '/amazon-lost-inventory-reimbursement',
    label: 'Amazon Lost Inventory Reimbursement',
    h1: 'Amazon Lost Inventory Reimbursement Without Chasing Cases',
    heroIntro:
      'Lost inventory claims rarely fail because the seller does not care. They fail because the inventory signal, evidence trail, case clock, and payout outcome live in different places. Margin keeps those pieces connected from discrepancy to resolution.',
    heroPoints: [
      'Identify inventory gaps across fulfillment, transfer, receiving, and adjustment activity.',
      'Organize the records that support a lost inventory reimbursement path.',
      'Track outcomes so approvals, reversals, and payouts do not disappear after filing.',
    ],
    sections: [
      {
        eyebrow: 'Category',
        heading: 'What lost inventory reimbursement is',
        body:
          'Amazon lost inventory reimbursement is the recovery process for units that should be accounted for inside FBA but are missing, adjusted, transferred, removed, or otherwise unresolved in seller reporting.',
        contextualSentence: [
          { type: 'text', text: 'For the broader operating model behind these cases, see ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: '.' },
        ],
        points: [
          {
            label: 'Fulfillment center losses',
            detail: 'Units can go missing after Amazon receives them, while they are stored, transferred, picked, packed, or adjusted.',
          },
          {
            label: 'Ledger mismatch',
            detail: 'The reimbursement question starts when inventory movement and financial settlement do not tell the same story.',
          },
          {
            label: 'Case timing',
            detail: 'Sellers often discover the issue after the event has aged, which makes evidence quality and timing control more important.',
          },
        ],
      },
      {
        eyebrow: 'Missed Claims',
        heading: 'Why inventory claims are missed',
        body:
          'Lost inventory work is missed when sellers only see a summary report. The recoverable event may be split across inventory adjustments, reconciliation reports, shipment records, and support history.',
        points: [
          {
            label: 'Signals are fragmented',
            detail: 'A single recovery path can require multiple reports before the loss is clear enough to act on.',
          },
          {
            label: 'Manual review is slow',
            detail: 'Operators postpone case work when they have to reconstruct the inventory trail by hand.',
          },
          {
            label: 'Outcomes need follow-through',
            detail: 'An opened case still needs rejection handling, dispute context, and payout tracking before it is truly resolved.',
          },
        ],
      },
      {
        eyebrow: 'Evidence',
        heading: 'Evidence required for inventory reimbursement',
        body:
          'Inventory reimbursement evidence usually needs to connect the expected units, Amazon movement records, seller-side documents, and the financial outcome. Margin structures that evidence before the case moves forward.',
        points: [
          {
            label: 'Inventory reports',
            detail: 'Inventory adjustments, reconciliation activity, and fulfillment center events help establish what changed.',
          },
          {
            label: 'Shipment and purchase records',
            detail: 'Inbound records, invoices, and reference IDs can support the seller-side quantity and ownership trail.',
          },
          {
            label: 'Payout records',
            detail: 'Settlement and reimbursement activity confirm whether the claim led to cash, reversal, or unresolved variance.',
          },
        ],
      },
      {
        eyebrow: 'Margin Workflow',
        heading: 'How Margin tracks inventory recovery',
        body:
          'Margin connects detection, classification, evidence binding, seller approval, and outcome tracking so lost inventory work does not turn into a queue of unresolved case IDs.',
        contextualSentence: [
          { type: 'text', text: 'Teams prioritizing recurring loss patterns often pair this with an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' view so inventory issues stay visible alongside other recovery categories.' },
        ],
        points: [
          {
            label: 'Case-ready organization',
            detail: 'Potential inventory losses are grouped with the records needed to review and prepare the recovery path.',
          },
          {
            label: 'Approval before action',
            detail: 'Sellers review the evidence and stay in control before filing activity moves forward.',
          },
          {
            label: 'Resolution visibility',
            detail: 'The workflow tracks whether the case is filed, rejected, disputed, approved, reversed, or paid.',
          },
        ],
      },
    ],
    workflowHeading: 'Margin keeps lost inventory recovery connected from discrepancy detection to payout truth.',
    workflowBody:
      'Lost inventory work is not just a report. Margin keeps each recovery opportunity attached to classification, evidence quality, seller review, and outcome tracking.',
    workflowSteps: sharedWorkflow,
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
    internalLinks: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/early-access', label: 'Secure early access' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    serviceName: 'Amazon lost inventory reimbursement service',
    serviceType: 'Amazon lost inventory reimbursement workflow',
    softwareDescription:
      'Margin identifies Amazon lost inventory reimbursement opportunities, organizes supporting evidence, and tracks recovery outcomes through resolution.',
    serviceDescription:
      'Margin helps Amazon sellers manage lost inventory reimbursement workflows by connecting discrepancy detection, evidence organization, claim preparation, approval, and payout tracking.',
  },
  '/amazon-reimbursement-audit': {
    path: '/amazon-reimbursement-audit',
    label: 'Amazon Reimbursement Audit',
    h1: 'Amazon Reimbursement Audit For Sellers Who Need More Than Reports',
    heroIntro:
      'An audit can surface reimbursement opportunities, but sellers still need a way to turn findings into recovery work. Margin connects audit signals to evidence, claim preparation, seller approval, and outcome tracking.',
    heroPoints: [
      'Audit inventory losses, shipment discrepancies, fee errors, and payout mismatches.',
      'Move findings into an actionable recovery workflow instead of a static report.',
      'Keep reimbursement work visible through dispute handling and payout reconciliation.',
    ],
    sections: [
      {
        eyebrow: 'Audit Scope',
        heading: 'What a reimbursement audit includes',
        body:
          'An Amazon reimbursement audit reviews account activity for events where Amazon may owe money because inventory, fees, refunds, shipments, or payouts do not reconcile cleanly.',
        contextualSentence: [
          { type: 'text', text: 'Sellers comparing the full category often start with ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' and then decide how audit coverage should be organized.' },
        ],
        points: [
          {
            label: 'Inventory activity',
            detail: 'Lost, adjusted, removed, transferred, or unresolved units can create reimbursement questions.',
          },
          {
            label: 'Shipment activity',
            detail: 'Inbound shortages and receiving discrepancies need shipment-level documentation before they are actionable.',
          },
          {
            label: 'Financial activity',
            detail: 'Fee errors, refund gaps, reimbursement reversals, and payout mismatches can all affect recovery value.',
          },
        ],
      },
      {
        eyebrow: 'Categories',
        heading: 'Common reimbursement categories',
        body:
          'Margin treats reimbursement categories as workflows with different evidence requirements, timing rules, and outcome paths rather than one generic recovery bucket.',
        contextualSentence: [
          { type: 'text', text: 'That usually means breaking the work into ' },
          { type: 'link', href: '/amazon-lost-inventory-reimbursement', label: 'Amazon lost inventory reimbursement' },
          { type: 'text', text: ' and ' },
          { type: 'link', href: '/amazon-inbound-shipment-shortage', label: 'Amazon inbound shipment shortage recovery' },
          { type: 'text', text: ' paths before filing decisions are made.' },
        ],
        points: [
          {
            label: 'Lost inventory',
            detail: 'Units that are not correctly accounted for after FBA movement or adjustment activity.',
          },
          {
            label: 'Inbound shortages',
            detail: 'Shipments where sent quantities, received quantities, and Amazon records do not match.',
          },
          {
            label: 'Fee and payout discrepancies',
            detail: 'Overcharges, measurement issues, settlement mismatches, reversals, and unresolved reimbursement outcomes.',
          },
        ],
      },
      {
        eyebrow: 'Beyond Reports',
        heading: 'Why audit reports alone are not enough',
        body:
          'A list of opportunities does not recover money by itself. Sellers still need to validate the finding, attach evidence, prepare the case, control filing, handle rejection, and reconcile the payout.',
        points: [
          {
            label: 'Findings need context',
            detail: 'A discrepancy is only useful when the claim type, evidence path, and timing condition are clear.',
          },
          {
            label: 'Filing still takes work',
            detail: 'Sellers often lose momentum when an audit exports work back into spreadsheets and support queues.',
          },
          {
            label: 'Resolution is financial',
            detail: 'The audit is not complete until the reimbursement, reversal, dispute, or payout outcome is tracked.',
          },
        ],
      },
      {
        eyebrow: 'Margin Workflow',
        heading: "Margin's recovery workflow",
        body:
          'Margin turns audit findings into operational recovery work by detecting, classifying, binding evidence, routing approval, and tracking the case outcome.',
        points: [
          {
            label: 'Detection to action',
            detail: 'Audit signals are organized around next steps, not just exported as disconnected findings.',
          },
          {
            label: 'Evidence-first preparation',
            detail: 'Each recovery opportunity is paired with the records needed to support the claim path.',
          },
          {
            label: 'Outcome management',
            detail: 'Approved, rejected, disputed, reversed, and paid states stay visible after filing.',
          },
        ],
      },
    ],
    workflowHeading: 'Margin turns reimbursement audit findings into recovery workflows sellers can actually operate.',
    workflowBody:
      'The workflow keeps audit results tied to claim type, required evidence, approval status, and payout outcome so findings do not stall after discovery.',
    workflowSteps: sharedWorkflow,
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
    internalLinks: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    serviceName: 'Amazon reimbursement audit service',
    serviceType: 'Amazon reimbursement audit and recovery workflow',
    softwareDescription:
      'Margin identifies Amazon reimbursement audit opportunities and organizes findings into evidence-backed recovery workflows.',
    serviceDescription:
      'Margin helps Amazon sellers audit reimbursement opportunities across inventory losses, shipment discrepancies, fee errors, and payout mismatches, then manage findings through recovery workflows.',
  },
  '/amazon-inbound-shipment-shortage': {
    path: '/amazon-inbound-shipment-shortage',
    label: 'Amazon Inbound Shipment Shortage',
    h1: 'Amazon Inbound Shipment Shortage Recovery',
    heroIntro:
      'Inbound shortage recovery depends on proving what was sent, what Amazon received, what Amazon counted, and what the account ultimately paid. Margin keeps shipment evidence and claim timing connected before windows expire.',
    heroPoints: [
      'Track shipment shortages before they become stale support work.',
      'Organize shipment documents, quantities, references, and receiving records.',
      'Monitor eligibility and outcome status through reimbursement resolution.',
    ],
    sections: [
      {
        eyebrow: 'Shortage Basics',
        heading: 'What inbound shortages are',
        body:
          'Amazon inbound shortages happen when the quantity a seller sends into FBA does not match what Amazon receives or recognizes. Recovery depends on proving the shipment trail clearly.',
        contextualSentence: [
          { type: 'text', text: 'Inside the broader category, this sits under ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' with its own document and timing requirements.' },
        ],
        points: [
          {
            label: 'Sent quantity',
            detail: 'The seller-side record shows what was packed, shipped, and expected at receiving.',
          },
          {
            label: 'Received quantity',
            detail: 'Amazon receiving activity may show fewer units, inconsistent counts, or unresolved discrepancies.',
          },
          {
            label: 'Financial impact',
            detail: 'Unresolved shortages can leave inventory value unrecovered if evidence and timing are not managed.',
          },
        ],
      },
      {
        eyebrow: 'Unresolved Work',
        heading: 'Why shortages go unresolved',
        body:
          'Shortage recovery often stalls because sellers have to match shipment plans, carrier records, bills of lading, invoices, receiving data, and case status across disconnected systems.',
        points: [
          {
            label: 'Documents live apart',
            detail: 'The records needed for one shortage case may live across Amazon, supplier files, carrier files, and internal folders.',
          },
          {
            label: 'Claim windows matter',
            detail: 'Shortage opportunities can become weaker when sellers wait too long to assemble support.',
          },
          {
            label: 'Follow-up gets lost',
            detail: 'A case can require additional documentation, dispute handling, or payout checks after the first submission.',
          },
        ],
      },
      {
        eyebrow: 'Documentation',
        heading: 'Required shipment documentation',
        body:
          'Inbound shortage claims usually depend on shipment-level evidence that connects purchase, shipment, receipt, and reconciliation activity.',
        points: [
          {
            label: 'Shipment records',
            detail: 'Shipment IDs, box content, carrier references, tracking, and receiving records anchor the claim path.',
          },
          {
            label: 'Commercial records',
            detail: 'Invoices, packing lists, purchase orders, and bills of lading help support what was sent.',
          },
          {
            label: 'Amazon records',
            detail: 'Receiving, reconciliation, case, and reimbursement records show how Amazon handled the discrepancy.',
          },
        ],
      },
      {
        eyebrow: 'Margin Workflow',
        heading: "Margin's evidence workflow",
        body:
          'Margin organizes shortage evidence around the shipment and keeps the recovery path visible from detection through approval, dispute handling, and payout tracking.',
        contextualSentence: [
          { type: 'text', text: 'Sellers reviewing recurring receiving problems often connect this work back to an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' so shortage cases can be prioritized against the rest of the recovery queue.' },
        ],
        points: [
          {
            label: 'Shipment-centered review',
            detail: 'Shortage signals are grouped by shipment so supporting records stay connected.',
          },
          {
            label: 'Evidence binding',
            detail: 'Documents and Amazon records are attached before the case is treated as ready.',
          },
          {
            label: 'Outcome tracking',
            detail: 'Margin tracks whether the shortage is unresolved, filed, disputed, approved, reversed, or paid.',
          },
        ],
      },
    ],
    workflowHeading: 'Margin keeps inbound shortage recovery tied to shipment evidence and claim timing.',
    workflowBody:
      'The workflow helps sellers move from shortage signal to evidence-backed recovery without losing track of documents, eligibility, approval, or payout status.',
    workflowSteps: sharedWorkflow,
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
    internalLinks: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/early-access', label: 'Secure early access' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    serviceName: 'Amazon inbound shipment shortage reimbursement service',
    serviceType: 'Amazon inbound shipment shortage recovery workflow',
    softwareDescription:
      'Margin tracks Amazon inbound shipment shortages, organizes shipment evidence, and monitors reimbursement outcomes.',
    serviceDescription:
      'Margin helps Amazon sellers manage inbound shipment shortage reimbursement by organizing shipment records, evidence, approval, claim preparation, and payout tracking.',
  },
  '/amazon-fee-overcharge-reimbursement': {
    path: '/amazon-fee-overcharge-reimbursement',
    label: 'Amazon Fee Overcharge Reimbursement',
    h1: 'Amazon Fee Overcharge Recovery Without Manual Investigation',
    heroIntro:
      'Fee overcharge recovery starts when product measurements, transaction events, fee charges, and payout records stop lining up. Margin helps sellers structure fee discrepancies into evidence-backed recovery workflows.',
    heroPoints: [
      'Identify fee discrepancies, measurement issues, and overcharge signals.',
      'Organize validation records before fee-related recovery work moves forward.',
      'Track fee recovery outcomes through follow-up, dispute, and payout reconciliation.',
    ],
    sections: [
      {
        eyebrow: 'Fee Recovery',
        heading: 'Fee overcharges explained',
        body:
          'Amazon fee overcharge reimbursement focuses on fees that appear inconsistent with product dimensions, weight, transaction behavior, storage logic, or settlement records.',
        contextualSentence: [
          { type: 'text', text: 'It is one branch of the wider ' },
          { type: 'link', href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
          { type: 'text', text: ' workflow, but it depends on its own validation trail.' },
        ],
        points: [
          {
            label: 'Measurement drift',
            detail: 'Incorrect dimensions or weight can affect fulfillment, storage, and related fee calculations.',
          },
          {
            label: 'Transaction mismatch',
            detail: 'A fee event may not match the product record, order context, or settlement outcome.',
          },
          {
            label: 'Recovery question',
            detail: 'The seller needs enough evidence to show why the charge should be reviewed or corrected.',
          },
        ],
      },
      {
        eyebrow: 'Scenarios',
        heading: 'Common fee discrepancy scenarios',
        body:
          'Fee discrepancies can involve measurement errors, storage charges, fulfillment fee changes, category or handling logic, reimbursement reversals, and settlement mismatches.',
        contextualSentence: [
          { type: 'text', text: 'When these issues repeat across the account, an ' },
          { type: 'link', href: '/amazon-reimbursement-audit', label: 'Amazon reimbursement audit' },
          { type: 'text', text: ' helps keep fee recovery aligned with inventory, shipment, and payout findings.' },
        ],
        points: [
          {
            label: 'Product measurement issues',
            detail: 'Incorrect size tier, weight, or dimensional records can create recurring fee differences.',
          },
          {
            label: 'Charge inconsistencies',
            detail: 'A fee may look wrong when compared with the SKU, transaction, inventory state, or account history.',
          },
          {
            label: 'Settlement mismatch',
            detail: 'The financial outcome matters because adjustments and reversals can change whether recovery actually occurred.',
          },
        ],
      },
      {
        eyebrow: 'Validation',
        heading: 'Evidence and validation requirements',
        body:
          'Fee-related recovery usually depends on proving the product, charge, measurement, or payout context clearly enough that the discrepancy can be reviewed.',
        points: [
          {
            label: 'Product records',
            detail: 'Catalog details, SKU data, dimensions, weight, and measurement history can support the review.',
          },
          {
            label: 'Fee and settlement records',
            detail: 'Fee previews, transaction reports, reimbursement activity, and settlement lines show the financial trail.',
          },
          {
            label: 'Case context',
            detail: 'Support history and prior adjustments help avoid duplicate or unsupported recovery work.',
          },
        ],
      },
      {
        eyebrow: 'Margin Workflow',
        heading: 'Recovery workflow',
        body:
          'Margin helps turn fee discrepancies into structured recovery work by tying detection, classification, evidence, seller review, and outcome tracking together.',
        points: [
          {
            label: 'Signal review',
            detail: 'Fee events are evaluated against product and financial context before they are treated as recovery opportunities.',
          },
          {
            label: 'Evidence preparation',
            detail: 'Measurement, transaction, and settlement records are organized around the fee issue.',
          },
          {
            label: 'Payout visibility',
            detail: 'Adjustments, reimbursements, reversals, and unresolved outcomes remain visible after the case moves forward.',
          },
        ],
      },
    ],
    workflowHeading: 'Margin gives fee overcharge recovery a connected workflow instead of another manual investigation.',
    workflowBody:
      'The workflow keeps fee signals tied to validation evidence, seller approval, case status, and payout outcomes.',
    workflowSteps: sharedWorkflow,
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
    internalLinks: [
      { href: '/amazon-fba-reimbursement', label: 'Amazon FBA reimbursement' },
      { href: '/pricing', label: 'View pricing' },
      { href: '/fba-reimbursement-research', label: 'FBA reimbursement research' },
    ],
    serviceName: 'Amazon fee overcharge reimbursement service',
    serviceType: 'Amazon fee overcharge recovery workflow',
    softwareDescription:
      'Margin identifies Amazon fee overcharge reimbursement opportunities, organizes validation evidence, and tracks fee recovery outcomes.',
    serviceDescription:
      'Margin helps Amazon sellers structure fee discrepancy recovery workflows around detection, evidence organization, claim preparation, approval, and payout tracking.',
  },
};

export const getAcquisitionPageData = (pathname: string) =>
  acquisitionPages[pathname.replace(/\/$/, '') || '/'];

export const buildAcquisitionStructuredData = (meta: RouteMeta, page: AcquisitionPageData) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${meta.canonical}#faq`,
      mainEntity: page.faqs.map((item) => ({
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
      '@id': `${meta.canonical}#software`,
      name: 'Margin',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: meta.canonical,
      description: page.softwareDescription,
      offers: {
        '@type': 'Offer',
        price: '99',
        priceCurrency: 'USD',
        description: 'Early access activation for Margin recovery workflow',
      },
    },
    {
      '@type': 'Service',
      '@id': `${meta.canonical}#service`,
      name: page.serviceName,
      serviceType: page.serviceType,
      provider: {
        '@type': 'Organization',
        name: 'Margin',
        url: 'https://margin-finance.com/',
      },
      areaServed: 'Worldwide',
      url: meta.canonical,
      description: page.serviceDescription,
    },
  ],
});
