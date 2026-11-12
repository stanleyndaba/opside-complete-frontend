import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const universalFaqs = [
  {
    question: "What exactly does Margin do?",
    answer:
      "Margin examines Amazon and related business records to establish what happened, what the available evidence supports, what appears to have been accounted for, what remains unresolved and what action, if any, is justified. Where the agreed scope includes it, Margin can carry authorized recovery work through to its recorded financial outcome.",
  },
  {
    question: "Is Margin a reimbursement tool or a financial investigation platform?",
    answer:
      "Margin is a financial investigation and recovery-control platform. It does not treat every discrepancy as a reimbursement opportunity. It connects the originating event, evidence, Amazon response, financial activity and subsequent outcome so a potential recovery can be assessed before action is taken.",
  },
  {
    question: "Does Margin replace our accounting, reconciliation or recovery systems?",
    answer:
      "No. Margin works alongside the systems your business already uses. Accounting, ERP, marketplace, operational and recovery systems retain their existing roles. Margin examines the relationships between the relevant records and maintains the investigation, decision and outcome as one accountable financial position.",
  },
  {
    question: "Does Margin require Amazon account access for the initial review?",
    answer:
      "No Amazon account authorization is inherently required to begin a records-based review. Margin can examine the relevant records you provide and assess what they establish about your Amazon financial position. If additional data or access is needed, Margin will explain what is required and why before proceeding.",
  },
  {
    question: "What records does Margin need?",
    answer:
      "The required records depend on the investigation scope and the question being examined. They may include Amazon reports, settlement and payout activity, inventory or fulfilment records, case history, transaction data, accounting records and supporting correspondence. Margin identifies the records needed to establish the position rather than requesting an unrestricted data handover.",
  },
  {
    question: "What can Margin read, change or submit?",
    answer:
      "The initial review is based on the records and access agreed for the engagement. Any additional account permissions, integrations or operational actions are scoped separately. The access granted determines what Margin can technically access or do, and reading records is separate from permission to take consequential action.",
  },
  {
    question: "Can Margin submit a recovery without authorisation?",
    answer:
      "No. Margin investigates the event, assembles the supporting evidence and prepares the proposed action. The authorized representative retains the decision right over submission and other consequential actions within the agreed engagement. Seller approval remains required before a recovery submission is made.",
  },
  {
    question: "What happens if the evidence is incomplete?",
    answer:
      "An incomplete evidence set does not automatically become a recovery claim. Margin identifies the missing information, assesses whether the available records support a conclusion and distinguishes established findings from unresolved questions. Unsupported amounts are not presented as established recoveries.",
  },
  {
    question: "What happens when Amazon rejects a recovery?",
    answer:
      "Margin connects the response to the original event, submission and evidence, then assesses whether the rejection identifies a correctable gap, a further evidence requirement or a reason to stop. Where correction or appeal is justified by the evidence and applicable process, the next action can be prepared and authorized. Where it is not, the reason for stopping remains visible.",
  },
  {
    question: "How does Margin establish whether a recovery was financially completed?",
    answer:
      "Margin distinguishes Amazon approval from a reimbursement or adjustment being recorded, reflected in settlement or payout activity and treated in the relevant financial records. The outcome remains open until the available records establish what was recorded and whether a residual difference remains.",
  },
  {
    question: "What happens after the initial review?",
    answer:
      "The review establishes what the available records explain, what appears accounted for, what potential exposure warrants further investigation and what remains unresolved. You then decide whether a defined recovery engagement, a financial control pilot, ongoing financial control or no further action is appropriate.",
  },
  {
    question: "How are paid engagements scoped and priced?",
    answer:
      "Margin scopes paid work according to the financial exposure, number and complexity of events, evidence requirements, entities and marketplaces involved, integration needs and level of operational responsibility. The proposed scope, fee and engagement terms are provided before you commit to paid work.",
  },
  {
    question: "How long does the review take?",
    answer:
      "Timing depends on the completeness, quality and volume of the records, the scope of the examination and whether additional evidence is required. Margin communicates the expected review timeline and its dependencies before work begins. Amazon responses, appeals and payment or settlement timing remain external dependencies.",
  },
  {
    question: "Where are our records stored, who can access them and how long are they retained?",
    answer:
      "Margin handles business records according to its applicable privacy and data-handling policies. Before providing sensitive records, you should be able to understand where they will be processed, which authorized personnel and service providers may access them, and how long they will be retained. Contact Margin for details applicable to your engagement.",
  },
  {
    question: "Are third-party or AI processing services involved?",
    answer:
      "Margin uses software and technical systems to support financial analysis and recovery workflows. Whether a particular engagement involves third-party infrastructure or AI processing depends on the services actually used. Relevant processing arrangements, information categories and safeguards should be disclosed before processing begins.",
  },
  {
    question: "Can we request deletion?",
    answer:
      "You can contact Margin to request deletion of records associated with your engagement. Requests are subject to applicable contractual, legal and retention obligations. Margin should confirm the request scope, explain any applicable exceptions and communicate the outcome once assessed.",
  },
] as const;

const audienceFaqs = {
  finance: [
    ["How do findings relate to our accounting records?", "Margin connects the relevant Amazon activity, settlement and payout evidence with accounting records where those records are included in the agreed scope. It distinguishes what Amazon approved, what was recorded, what reached settlement or payout and what remains unaccounted for."],
    ["How are approved, recorded and paid reimbursements distinguished?", "Approval is not treated as financial completion. Margin keeps the decision, recorded adjustment or reimbursement, settlement or payout evidence and any remaining variance distinguishable in the financial position."],
    ["Can Margin identify unresolved financial questions without treating every difference as a loss?", "Yes. Margin tests alternative explanations such as timing differences, reversals, duplicate entries and accounted-for adjustments before identifying a difference as unresolved or potentially recoverable."],
  ],
  founder: [
    ["How much time will I need to contribute?", "You provide the agreed records, answer material questions and review the resulting position or proposed actions. Margin carries the investigation and authorized follow-through within the agreed scope so you do not have to coordinate every evidence request or case development."],
    ["What work does Margin take over?", "Margin can take on the agreed investigation, evidence assembly, recovery preparation, response management and financial outcome follow-through. Your business retains approval authority and any responsibilities reserved in the engagement scope."],
    ["Do I have to commit to paid recovery after the initial review?", "No. The initial review establishes what the records support. You decide whether any defined recovery or ongoing control engagement is justified and whether to proceed."],
  ],
  operations: [
    ["Does every operational exception warrant recovery?", "No. Margin examines the originating event, available evidence, Amazon response and financial activity before determining whether further recovery work is justified. An operational exception may be explained, already accounted for or still unresolved without being a recovery claim."],
    ["Can Margin investigate an event after its operational case has closed?", "Yes, where the available records and agreed scope support the investigation. Closing an operational case does not automatically establish that its financial consequence has been reconciled."],
    ["How are evidence gaps and outstanding responsibilities identified?", "Margin records the missing support, current status, accountable owner and next justified action alongside the originating event and case history, so the operational and financial follow-through remain connected."],
  ],
  aggregator: [
    ["Can we begin with selected accounts?", "Yes. The initial review can cover a defined group of Amazon accounts or brands so the business can establish the need, methodology and potential scope before expanding the engagement."],
    ["How are different seller accounts and their records kept separate?", "Account, entity, marketplace and reporting-period context remain part of the investigation scope. Findings are grounded in the records of the individual account being examined rather than treating portfolio totals as interchangeable evidence."],
    ["How do we decide whether to expand the work across more brands?", "Expansion should follow the evidence, the pattern of unresolved work, the complexity of the accounts and the business case for additional responsibility—not simply the number of brands in the portfolio."],
  ],
  enterprise: [
    ["How is the investigation scope agreed?", "The engagement defines the participating accounts, entities, marketplaces, periods, issue categories, required records, operating owners, access permissions and approval boundaries before the work begins."],
    ["How does Margin work alongside existing ERP and recovery providers?", "Margin does not need to replace those responsibilities. It examines the financial history behind defined marketplace activity and connects relevant operational, case, settlement and accounting records within the agreed scope."],
    ["How are access, approvals and accountability established?", "The engagement records what information is required, which actions Margin may take, who reviews findings, which actions require authorization and who owns outstanding exceptions and decisions."],
  ],
} as const;

type Audience = keyof typeof audienceFaqs;

export function AudienceFaqSection({ audience }: { audience: Audience }) {
  const items = [...universalFaqs, ...audienceFaqs[audience].map(([question, answer]) => ({ question, answer }))];

  return (
    <section className="relative overflow-hidden bg-white py-14 sm:py-20 md:py-24" aria-labelledby={`${audience}-faq-title`}>
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="max-w-[900px]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B857F]">Trust and access</p>
          <h2 id={`${audience}-faq-title`} className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">Questions worth answering before you give anyone access to your financial records.</h2>
          <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin’s approach to evidence, access, authorization and financial closure should remain clear regardless of who owns the problem inside the business.</p>
        </div>
        <Accordion type="single" collapsible className="mt-10 max-w-[980px] border-t border-[#D8DEDA] md:mt-14">
          {items.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`${audience}-faq-${index}`} className="border-b border-[#D8DEDA]">
              <AccordionTrigger className="py-6 text-left text-[17px] font-semibold tracking-[-0.025em] text-[#182026] hover:no-underline sm:text-[20px]">{question}</AccordionTrigger>
              <AccordionContent className="pr-10 text-[14px] leading-7 text-[#52616A] sm:text-[16px] sm:leading-8">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-semibold text-[#635BFF]">
          <a href="/security" className="underline decoration-[#B8B0FF] underline-offset-4">Data Privacy &amp; Security →</a>
          <a href="/access-scope" className="underline decoration-[#B8B0FF] underline-offset-4">Review the Amazon access scope →</a>
          <a href="/contact" className="underline decoration-[#B8B0FF] underline-offset-4">Still have a question? Talk to Margin →</a>
        </div>
      </div>
    </section>
  );
}
