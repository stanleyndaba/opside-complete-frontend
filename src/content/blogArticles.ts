export type BlogArticle = {
  slug: string;
  eyebrow: string;
  title: string;
  audience: string;
  description: string;
  readTime: string;
  sections: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'questions'; items: Array<{ question: string; answer: string }> }
    | { type: 'numbered'; items: Array<{ title: string; body: string }> }
  >;
  ctaHeading: string;
  ctaBody: string;
  disclaimer: string;
  related: string[];
};

export const blogArticles: BlogArticle[] = [
  {
    slug: 'provider-accountability',
    eyebrow: 'Provider accountability',
    title: 'Your Amazon recovery provider says the work is done. Can Finance verify the outcome?',
    audience: 'CFOs, Controllers, Finance Directors and established Amazon brands already using recovery providers.',
    description: 'Independent recovery assurance for businesses that need to establish what was actually recovered, settled and reconciled.',
    readTime: '3 min read',
    sections: [
      { type: 'paragraph', text: 'For an established Amazon business, managing reimbursements is rarely just a matter of identifying an issue and submitting a claim.' },
      { type: 'paragraph', text: 'There may be an inventory discrepancy, an investigation, supporting documentation, a case submitted to Amazon, a reimbursement decision and, eventually, a financial adjustment.' },
      { type: 'paragraph', text: 'Each step produces its own records. Each may be managed by a different person, team or service provider.' },
      { type: 'paragraph', text: 'But there is one question that matters beyond the status of any individual case: Can your business establish what was actually recovered, what reached settlement, and what has been financially reconciled?' },
      { type: 'heading', text: 'A resolved case is not necessarily a financially closed outcome' },
      { type: 'paragraph', text: 'When a recovery provider reports that a case has been resolved, that is useful information. It tells you something about the progress of the recovery process. But the financial picture may require further examination.' },
      { type: 'paragraph', text: 'Consider a typical sequence: an inventory discrepancy is identified; supporting evidence is gathered; a reimbursement claim is submitted; Amazon responds and the case is marked resolved; a reimbursement or adjustment is recorded; the amount is expected to appear in a subsequent settlement; and Finance must establish how that amount was ultimately reflected in the business’s financial records.' },
      { type: 'paragraph', text: 'The important distinction is between a recovery action being completed and its financial outcome being established. A case status, reimbursement record, settlement entry and accounting entry are different pieces of information. They should not automatically be treated as interchangeable evidence of financial closure.' },
      { type: 'heading', text: 'What happens between the recovery report and the financial records?' },
      { type: 'paragraph', text: 'For businesses operating at scale, recovery activity can span multiple reporting periods. An amount may be approved in one period and reflected in a later settlement. A reimbursement may be adjusted. A previously recorded amount may subsequently be reversed. An accounting entry may exist without making the underlying operational event immediately identifiable.' },
      { type: 'paragraph', text: 'None of these situations necessarily means the recovery provider has done something wrong. They mean Finance needs a reliable way to establish what happened across the complete sequence.' },
      { type: 'list', items: ['The original inventory event, transaction, fee or discrepancy.', 'The supporting Amazon records and evidence.', 'The recovery claim and its associated case history.', 'Amazon’s decision, including any adjustment or reversal.', 'The reimbursement and corresponding settlement activity.', 'The accounting treatment and final reconciliation status.'] },
      { type: 'paragraph', text: 'The objective is not simply to produce another list of claims. It is to establish the financial outcome behind the activity.' },
      { type: 'heading', text: 'Questions Finance should be able to answer' },
      { type: 'questions', items: [
        { question: 'What value was examined?', answer: 'What underlying events and financial activity were included in the review?' },
        { question: 'What value was supported by evidence?', answer: 'Which identified discrepancies were substantiated by the available records?' },
        { question: 'What was actually recovered?', answer: 'Which amounts were reimbursed or otherwise financially credited, rather than simply submitted or approved?' },
        { question: 'What reached settlement?', answer: 'Can the recovery be traced to the relevant settlement activity?' },
        { question: 'What was reconciled?', answer: 'Does the financial outcome agree with the corresponding accounting records?' },
        { question: 'What remains unresolved?', answer: 'Are there outstanding discrepancies, incomplete outcomes, reversals or amounts requiring further investigation?' },
      ] },
      { type: 'heading', text: 'Independent assurance does not have to mean replacing your existing provider' },
      { type: 'paragraph', text: 'An established Amazon business may already have a recovery provider, an internal reconciliation team, an accounting platform and an established reporting process. There is no automatic reason to replace those arrangements.' },
      { type: 'paragraph', text: 'The question is whether the combined process gives the business sufficient visibility into the financial outcome of its recovery activity. An independent examination can help establish whether reported recoveries are supported by the underlying records, whether the financial outcome can be traced through settlement, and whether anything remains unresolved.' },
      { type: 'paragraph', text: 'That is a different responsibility from simply managing the original claim.' },
      { type: 'heading', text: 'Know what happened to the financial outcome' },
      { type: 'paragraph', text: 'At scale, the value of recovery management is not measured only by how many claims were submitted or how many cases were closed. It is also measured by whether the business can establish what happened to the value behind those claims.' },
      { type: 'paragraph', text: 'Finance should not have to rely solely on a provider’s completed-case report to understand the financial position. It should be able to see the underlying activity, the evidence, the recovery outcome and the reconciliation status.' },
    ],
    ctaHeading: 'Let Margin examine the financial outcome.',
    ctaBody: 'Margin offers established Amazon businesses a Free Recovery Audit. We examine relevant Amazon financial and operational records to identify discrepancies, establish what the available evidence supports, and determine what can be traced through recovery and settlement. You do not need to replace your existing provider to begin.',
    disclaimer: 'Margin examines the records and evidence provided. Findings and potential recovery actions depend on the available information and applicable Amazon processes.',
    related: ['operational-complexity', 'financial-period-closure'],
  },
  {
    slug: 'operational-complexity',
    eyebrow: 'Operational complexity',
    title: 'As your Amazon operation grows, can your financial controls keep up?',
    audience: 'COOs, Heads of Marketplace Operations, Finance Directors and established FBA brands.',
    description: 'A growing Amazon operation needs more than visibility into sales, inventory and settlements. It needs a connected explanation of what happened financially.',
    readTime: '3 min read',
    sections: [
      { type: 'paragraph', text: 'Growth changes the nature of an Amazon business. More inventory moves through fulfilment centres. More shipments are received and processed. More customer returns occur. More fees, adjustments and settlement transactions accumulate.' },
      { type: 'paragraph', text: 'For an established brand, these activities are part of normal operations. The challenge is that every operational event can have a financial consequence, and establishing that consequence may require information from several different Amazon reports, internal systems and teams.' },
      { type: 'heading', text: 'Your Amazon operation creates a continuous chain of financial events' },
      { type: 'paragraph', text: 'Consider the journey of inventory through an Amazon business. A shipment leaves a warehouse. Amazon receives the inventory. Units are moved between fulfilment centres. Customer orders are fulfilled. Some units are returned. Others may be damaged, misplaced or adjusted.' },
      { type: 'paragraph', text: 'Fees are charged. Reimbursements may be issued. Settlement transactions record financial activity. Each event has its own operational and financial records.' },
      { type: 'paragraph', text: 'The problem is not necessarily that these records are unavailable. It is that they do not automatically provide one continuous explanation of what happened to every financially relevant event.' },
      { type: 'heading', text: 'Where the operational workflow becomes difficult to trace' },
      { type: 'numbered', items: [
        { title: 'Inbound shipments and inventory movements', body: 'Inventory leaves your facility with an expected quantity and value. Amazon subsequently records receipt, movement and fulfilment-centre activity. When quantities differ, Finance or Operations may need to establish what was shipped, what Amazon recorded receiving, what subsequently happened to the inventory and whether a financial adjustment or reimbursement was warranted. A difference in records is a reason to investigate, not automatically proof of a recoverable loss.' },
        { title: 'Customer returns and inventory adjustments', body: 'A customer return may result in inventory being returned to available stock, classified as unsellable, adjusted or otherwise processed. The operational status and the financial treatment need to be understood together. A return being processed does not, by itself, establish whether every related financial consequence has been correctly reflected.' },
        { title: 'Fees and financial adjustments', body: 'Amazon fees can arise from several operational activities. Storage, fulfilment, removals, returns and other adjustments can create transactions that require examination against the underlying activity. For a business with a substantial SKU range and recurring transaction volume, the challenge is establishing whether the charge is supported by the relevant records and whether an adjustment is warranted.' },
        { title: 'Reimbursements and recovery decisions', body: 'When an operational discrepancy warrants a claim, evidence must be gathered, eligibility established, claims submitted and Amazon’s response monitored. But the recovery process introduces additional records that must remain connected to the original event. A claim should not become an isolated transaction disconnected from the inventory or operational activity that produced it.' },
        { title: 'Settlement and financial reconciliation', body: 'Eventually, the financial outcome must be traced. Was a reimbursement issued? Did it appear in the appropriate settlement? Was it subsequently adjusted or reversed? Does the accounting treatment agree with the underlying financial activity? This is where an operational discrepancy becomes a financial-control question.' },
      ] },
      { type: 'heading', text: 'The challenge is not necessarily a lack of systems' },
      { type: 'paragraph', text: 'Established Amazon businesses often have sophisticated operational teams, accounting platforms, inventory systems and specialist service providers. Each may perform its intended function well.' },
      { type: 'paragraph', text: 'Inventory systems record inventory. Amazon reports document marketplace activity. Recovery providers manage claims. Settlement-accounting tools help transfer and reconcile financial transactions. But having several functioning systems does not automatically establish that the complete financial outcome of an individual event has been traced.' },
      { type: 'list', items: ['Can an inventory discrepancy be traced to its supporting evidence?', 'Can a recovery claim be connected to the original operational event?', 'Can the reimbursement be identified in settlement activity?', 'Can a subsequent adjustment or reversal be identified?', 'Can Finance establish the final accounting treatment?', 'Can outstanding items be distinguished from completed financial outcomes?'] },
      { type: 'heading', text: 'Financial control should keep pace with operational growth' },
      { type: 'paragraph', text: 'A growing Amazon business should not have to reconstruct months of operational history every time Finance needs to understand an outstanding discrepancy. Nor should the business have to treat every completed claim, reimbursement or settlement entry as proof that the underlying financial matter is fully resolved.' },
      { type: 'paragraph', text: 'The objective is a traceable financial workflow: one in which the original event, evidence, recovery decision, Amazon response, settlement activity and accounting treatment can be examined as connected parts of the same financial outcome.' },
      { type: 'paragraph', text: 'That gives Operations and Finance a clearer understanding of what happened, what was recovered, what was reconciled and where attention is still required.' },
      { type: 'heading', text: 'Understand what your Amazon operation has actually produced financially' },
      { type: 'paragraph', text: 'Margin examines Amazon financial and operational activity to establish what the available records support, what may warrant recovery action, what has actually been recovered and what remains unresolved.' },
      { type: 'paragraph', text: 'Our Free Recovery Audit gives your business an opportunity to examine its Amazon activity before deciding whether further work is necessary. You do not need to begin by changing your existing systems or operational arrangements.' },
    ],
    ctaHeading: 'Let Margin examine your Amazon financial activity.',
    ctaBody: 'Submit the relevant Amazon records for a Free Recovery Audit. We’ll examine the available evidence, identify potential discrepancies and establish which findings warrant further attention. Your operation keeps moving. You deserve to know what is happening financially behind it.',
    disclaimer: 'Audit findings depend on the records supplied, the period examined and the available evidence. Not every discrepancy will qualify for recovery.',
    related: ['financial-period-closure', 'provider-accountability'],
  },
  {
    slug: 'financial-period-closure',
    eyebrow: 'Financial-period closure',
    title: 'What does a properly closed Amazon financial period actually look like?',
    audience: 'CFOs, Controllers, Financial Directors and enterprise Amazon businesses.',
    description: 'A completed accounting period is not automatically a complete financial outcome. Closure should preserve what was examined, supported, recovered, reconciled and left unresolved.',
    readTime: '3 min read',
    sections: [
      { type: 'paragraph', text: 'An Amazon financial period can appear complete. Sales have been recorded. Fees have been posted. Settlement reports have been downloaded. Deposits have been received. Accounting entries have been processed.' },
      { type: 'paragraph', text: 'The reporting period may even have been closed in the accounting system. But there is a question worth asking: Does the financial close establish what happened to the underlying Amazon activity, including discrepancies, recoveries, adjustments and unresolved financial outcomes?' },
      { type: 'paragraph', text: 'For an established Amazon business, this distinction matters. A completed accounting period does not necessarily mean every operationally generated financial issue has been investigated, recovered, reconciled or otherwise resolved.' },
      { type: 'heading', text: 'Recording the settlement is not the same as establishing every financial outcome' },
      { type: 'paragraph', text: 'Amazon settlement reports provide important information about financial transactions and the amounts included in settlement. Accounting integrations can help transfer those transactions into accounting systems and reconcile deposits. These are essential parts of financial management.' },
      { type: 'paragraph', text: 'But the settlement itself is only one part of a much larger sequence. An inventory discrepancy may have occurred weeks before a reimbursement claim was submitted. The claim may have been approved in another period. A reimbursement may appear in a subsequent settlement. An adjustment or reversal may follow.' },
      { type: 'paragraph', text: 'If the original event, claim, reimbursement and settlement activity are not connected, Finance may have difficulty establishing the complete financial history. The accounting system can accurately record the transactions it receives while the underlying recovery outcome still requires separate investigation.' },
      { type: 'heading', text: 'Six questions that make an Amazon financial close more meaningful' },
      { type: 'numbered', items: [
        { title: 'What volume of activity was examined?', body: 'Finance should understand the scope of the review: which inventory movements, returns, fees, adjustments, reimbursements and other relevant transactions were examined.' },
        { title: 'What financial value was investigated?', body: 'Finance should distinguish the value examined from the value identified as potentially problematic. This creates a clearer picture of the financial exposure that was actually reviewed.' },
        { title: 'What value was supported by evidence?', body: 'An apparent discrepancy is not the same as a substantiated finding. Supporting records must establish what happened, whether the relevant requirements are satisfied and whether a financial action is justified.' },
        { title: 'What was actually recovered?', body: 'A claim submitted is not necessarily a claim approved, and a claim approved is not necessarily a reimbursement already reflected in settlement. The business needs to distinguish between amounts identified, submitted, approved, issued and actually reflected in the relevant financial records.' },
        { title: 'What value was reconciled?', body: 'The recovery outcome should be connected to the settlement and accounting records. Finance should establish whether the amount expected agrees with the amount received or credited, and whether the corresponding accounting treatment is supported.' },
        { title: 'What remains unresolved?', body: 'A meaningful close should not hide outstanding items simply because the reporting period has ended. Claims awaiting decisions, reimbursements awaiting settlement, disputed amounts, reversals, incomplete evidence and transactions requiring further reconciliation should remain visible.' },
      ] },
      { type: 'heading', text: 'Why these distinctions matter at scale' },
      { type: 'paragraph', text: 'A small number of unresolved transactions may be manageable through manual follow-up. But as an Amazon business grows, the volume and age of outstanding items can become harder to track.' },
      { type: 'paragraph', text: 'Different teams may own different stages of the workflow. Operational records may sit in Amazon reports. Recovery activity may be managed by an external provider. Settlement transactions may flow through an accounting integration. The business can have all these processes in place and still lack a unified view of the financial outcomes.' },
      { type: 'paragraph', text: 'The objective is not to reopen every historical transaction indefinitely. It is to establish a consistent process for identifying financially relevant exceptions, investigating them, tracing their outcomes and carrying unresolved items forward until they are appropriately closed.' },
      { type: 'heading', text: 'From settlement reporting to financial closure' },
      { type: 'paragraph', text: 'A more complete Amazon financial-control process connects three important records: Amazon’s records of the original operational and financial activity; recovery evidence and case records covering investigation, decisions, submissions, responses and subsequent actions; and accounting records containing financial entries, settlement treatment, deposits and reconciliation outcomes.' },
      { type: 'paragraph', text: 'Together, these provide a stronger basis for establishing the financial status of an event. The goal is to distinguish what was examined, what was supported, what was recovered, what was reconciled and what remains unresolved.' },
      { type: 'heading', text: 'A financial period should leave you with more than a closed set of books' },
      { type: 'paragraph', text: 'Your Amazon business has a continuous flow of operational and financial activity. The financial-control process should be capable of following the material events through their eventual outcomes.' },
      { type: 'paragraph', text: 'Finance should have more than a settlement summary or a list of completed reimbursement cases. It should have a defensible understanding of what happened, what the evidence establishes, what financial value was recovered and reconciled, and which matters still require attention.' },
      { type: 'paragraph', text: 'That is what makes financial closure meaningful.' },
      { type: 'heading', text: 'Establish what has actually happened in your Amazon business' },
      { type: 'paragraph', text: 'Margin independently examines Amazon financial and operational records to establish what the available evidence supports, what has been recovered, what can be traced through settlement and what remains unresolved.' },
      { type: 'paragraph', text: 'Our Free Recovery Audit gives established Amazon businesses a starting point for understanding their financial position. You can begin with an examination of relevant historical and current records, without first committing to a paid engagement or replacing your existing accounting and recovery arrangements.' },
    ],
    ctaHeading: 'Your Amazon records should tell a complete financial story.',
    ctaBody: 'Let Margin examine your Amazon financial activity through a Free Recovery Audit. Get a clearer understanding of what has been accounted for, what has been recovered and what still needs attention.',
    disclaimer: 'The scope and conclusions of an audit depend on the records supplied and the period examined. Margin establishes findings from available evidence and does not treat an identified discrepancy as a confirmed recovery until the supporting requirements have been established.',
    related: ['provider-accountability', 'operational-complexity'],
  },
];

export const blogArticleBySlug = Object.fromEntries(blogArticles.map((article) => [article.slug, article])) as Record<string, BlogArticle>;
