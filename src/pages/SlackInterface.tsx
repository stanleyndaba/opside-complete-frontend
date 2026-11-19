import { usePageMeta } from '@/hooks/usePageMeta';
import { AtSign, Headphones, MoreHorizontal, Paperclip, Pencil, Plus, Search, Send, Smile, Sparkles } from 'lucide-react';

const channels = [
  { name: 'general' },
  { name: 'recovery-operations', unread: 1 },
  { name: 'evidence-review' },
  { name: 'fulfilment-ops' },
  { name: 'finance-control' },
  { name: 'amazon-responses', unread: 3 },
  { name: 'settlement-review' },
  { name: 'random' },
];

const directMessages = [
  { name: 'Finance Operations', initials: 'FO', color: '#e8a34b', status: 'online', unread: 2 },
  { name: 'Fulfilment Operations', initials: 'FO', color: '#5da5cf', status: 'away' },
  { name: 'Controller · Financial Control', initials: 'FC', color: '#b56bc1', status: 'online' },
  { name: 'Recovery Owner', initials: 'RO', color: '#77a86e', status: 'offline' },
  { name: 'Margin', initials: 'M', color: '#d47767', status: 'online' },
  { name: 'Marginbot', initials: 'M', color: '#7b5a8f', status: 'online' },
];

const messages = [
  {
    author: 'Margin',
    initials: 'M',
    color: '#e8a34b',
    time: 'Just now',
    text: 'Resolution work prepared · supported exposure $1,284.60. Margin connected the receiving record, cost basis, and settlement line. The supported position is separated from accounted-for value and unresolved exceptions. Seller approval remains required before submission.',
    documents: ['Receiving Event Record', 'Unit Cost Basis', 'Settlement Detail'],
  },
  {
    author: 'Finance Operations',
    initials: 'FO',
    color: '#e8a34b',
    time: 'Just now',
    text: 'Investigation packet is ready. The source population, affected units, valuation basis, and next action are assembled. No manual record chase is required to begin review.',
    documents: ['Evidence Register', 'Unit Cost Basis'],
  },
  {
    author: 'Fulfilment Operations',
    initials: 'FO',
    color: '#5da5cf',
    time: 'Just now',
    text: 'Only the unresolved source question is routed. Margin matched the carrier, receiving, and shipment records. Fulfilment only needs to confirm the remaining custody exception.',
    documents: ['Carrier Custody Record', 'Receiving Event Record'],
  },
  {
    author: 'Controller · Financial Control',
    initials: 'FC',
    color: '#b56bc1',
    time: 'Just now',
    text: 'The control position is reviewable. Supported exposure, accounted-for value, approval boundary, and unresolved items remain distinct. The position is ready for a controlled decision.',
    documents: ['Settlement Reconciliation', 'Approval Boundary'],
  },
];

function SlackInterface() {
  usePageMeta({
    title: 'Team Handoff | Margin',
    description: 'A Slack-style recovery operations handoff for a governed Margin investigation.',
    url: '/slack-interface',
    robots: 'noindex, nofollow',
  });

  return (
    <main className="slack-interface min-h-screen overflow-hidden bg-white p-3 font-sans text-[#292530] sm:p-6 lg:p-10">

      <section className="slack-window relative mx-auto flex h-[calc(100vh-24px)] min-h-[560px] w-full max-w-[1120px] flex-col overflow-hidden rounded-[7px] bg-white shadow-[0_25px_70px_rgba(39,55,76,0.26)] sm:h-[calc(100vh-48px)] lg:h-[640px]" aria-label="Slack workspace interface">
        <header className="flex h-8 shrink-0 items-center gap-3 bg-[#47134f] px-3 text-white sm:h-9 sm:px-4">
          <div className="flex w-[142px] shrink-0 items-center gap-2 text-[11px] font-semibold sm:w-[152px]">
            <span className="h-2 w-2 rounded-full bg-[#f4bd45]" aria-hidden="true" />
            <span>Northstar Commerce</span>
            <span className="ml-auto text-[10px] text-white/75">⌄</span>
          </div>
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex h-5 w-full max-w-[420px] items-center justify-center gap-2 rounded-[4px] bg-[#6f3c72] px-3 text-[9px] text-white/85 shadow-inner sm:h-6 sm:text-[10px]">
              <Search className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span>Search Northstar Commerce</span>
            </div>
          </div>
          <div className="w-[142px] shrink-0" aria-hidden="true" />
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[142px] shrink-0 overflow-y-auto bg-[#4a0c4f] px-2.5 py-3 text-white sm:w-[152px] sm:px-3.5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[-0.01em]">Northstar Commerce</span>
              <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#4a0c4f] shadow-sm transition hover:bg-[#f4eaf5]" aria-label="Compose new message">
                <Pencil className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-4 text-[9px] leading-none text-white/65 sm:text-[10px]">
              <div>
                <div className="mb-2 flex items-center justify-between px-1.5">
                  <p className="font-medium text-white/75">Channels</p>
                  <button type="button" className="text-white/55 transition hover:text-white" aria-label="Add a channel"><Plus className="h-3 w-3" /></button>
                </div>
                <nav className="space-y-0.5" aria-label="Channels">
                  {channels.map((channel) => {
                            const active = channel.name === 'recovery-operations';
                    return (
                      <button
                        key={channel.name}
                        type="button"
                        className={`flex h-5 w-full items-center gap-1.5 rounded-[2px] px-1.5 text-left transition ${active ? 'bg-[#0f86bd] font-bold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="text-[10px] text-white/75">#</span>
                        <span className="truncate">{channel.name}</span>
                        {channel.unread && <span className="ml-auto flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-1 text-[8px] font-bold text-[#1684b7]">{channel.unread}</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between px-1.5">
                  <p className="font-medium text-white/75">Direct messages</p>
                  <button type="button" className="text-white/55 transition hover:text-white" aria-label="Start a direct message"><Plus className="h-3 w-3" /></button>
                </div>
                <nav className="space-y-0.5" aria-label="Direct messages">
                  {directMessages.map((person) => (
                    <button key={person.name} type="button" className="flex h-5 w-full items-center gap-1.5 rounded-[2px] px-1.5 text-left text-white/75 transition hover:bg-white/10 hover:text-white">
                      <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] text-[7px] font-bold text-white" style={{ backgroundColor: person.color }}>
                        {person.initials}
                        <span className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-[#4a0c4f] ${person.status === 'online' ? 'bg-[#54c48b]' : person.status === 'away' ? 'bg-[#f2b84b]' : 'bg-[#8b8590]'}`} />
                      </span>
                      <span className="truncate">{person.name}</span>
                      {person.unread && <span className="ml-auto flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-1 text-[8px] font-bold text-[#4a0c4f]">{person.unread}</span>}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="pt-1">
                <p className="mb-2 px-1.5 font-medium text-white/75">Apps</p>
                <button type="button" className="flex items-center gap-1.5 px-1.5 text-white/75 transition hover:text-white">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[2px] bg-white/90 text-[8px] font-bold text-[#4a0c4f]">E</span>
                  <span>Enjamb</span>
                </button>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col bg-white">
            <header className="flex h-9 shrink-0 items-center justify-between border-b border-[#ece8eb] px-4 sm:h-10 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-[11px] font-bold text-[#25232a] sm:text-[12px]"><span className="mr-1 text-[#55515a]">#</span>recovery-operations</h1>
                <span className="hidden truncate text-[9px] text-[#817d83] sm:inline">Evidence-backed recovery handoff</span>
              </div>
              <button type="button" className="rounded p-1 text-[#817d83] transition hover:bg-[#f4f1f4] hover:text-[#4a0c4f]" aria-label="Start a huddle">
                <Headphones className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5" aria-label="Channel message history">
                <div className="mb-4 flex items-center gap-3 text-[9px] text-[#aaa5ac]">
                  <span className="h-px flex-1 bg-[#eee9ed]" />
                  <span>Today</span>
                  <span className="h-px flex-1 bg-[#eee9ed]" />
                </div>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <article key={`${message.author}-${message.time}`} className="flex gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white" style={{ backgroundColor: message.color }}>{message.initials}</div>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-[10px] font-bold text-[#292530] sm:text-[11px]">{message.author}</h2>
                          <time className="text-[8px] text-[#aaa5ac] sm:text-[9px]">{message.time}</time>
                        </div>
                          <p className="mt-0.5 max-w-[690px] text-[10px] leading-[1.55] text-[#4e4a52] sm:text-[11px]">{message.text}</p>
                          {message.documents?.length ? <div className="mt-1.5 flex flex-wrap gap-1.5">{message.documents.map((document) => <span key={document} className="rounded-[3px] bg-[#f6f2f7] px-1.5 py-1 text-[8px] font-medium text-[#6b4671] sm:text-[9px]">{document}</span>)}</div> : null}
                      </div>
                    </article>
                  ))}
                  <p className="flex items-center gap-2 text-[9px] font-medium tracking-tight text-[#26704e]"><span className="h-1.5 w-1.5 rounded-full bg-[#26704e]" />Investigation carried by Margin · Decision rights retained by Finance</p>
                </div>
              </div>

              <div className="px-4 pb-3 sm:px-5 sm:pb-4">
                <div className="overflow-hidden rounded-[4px] border border-[#d4d1d5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#7c3b80] focus-within:ring-1 focus-within:ring-[#7c3b80]/20">
                  <div className="flex h-6 items-center gap-3 border-b border-[#f0edf0] px-2.5 text-[#aaa5ac] sm:h-7">
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add formatting"><span className="text-[11px] font-bold">B</span></button>
                    <button type="button" className="rounded text-[10px] italic hover:text-[#4a0c4f]" aria-label="Italicize message">I</button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add link"><span className="text-[10px]">↗</span></button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add list"><span className="text-[10px]">≡</span></button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add code"><span className="text-[10px]">&lt;&gt;</span></button>
                  </div>
                  <div className="flex min-h-[40px] items-center px-2.5 text-[10px] text-[#8d8990] sm:min-h-[44px] sm:text-[11px]">Message #recovery-operations</div>
                  <div className="flex items-center justify-between px-2.5 pb-2 text-[#aaa5ac]">
                    <div className="flex items-center gap-2.5">
                      <button type="button" className="rounded-full hover:text-[#4a0c4f]" aria-label="Add attachment"><Plus className="h-3.5 w-3.5" strokeWidth={2.2} /></button>
                      <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Attach file"><Paperclip className="h-3 w-3" /></button>
                      <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Mention someone"><AtSign className="h-3.5 w-3.5" /></button>
                      <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add emoji"><Smile className="h-3.5 w-3.5" /></button>
                      <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add shortcut"><Sparkles className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="rounded p-1 text-[#aaa5ac] hover:text-[#4a0c4f]" aria-label="More message options"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                      <button type="button" className="rounded bg-[#e9e5e9] p-1 text-[#aaa5ac]" aria-label="Send message"><Send className="h-3 w-3" fill="currentColor" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SlackInterface;
