import { usePageMeta } from '@/hooks/usePageMeta';
import { Headphones, MoreHorizontal, Pencil, Search, Send, Smile, Sparkles, AtSign, Plus, Paperclip } from 'lucide-react';

const channels = ['general', 'quality', 'stability-ops', 'regulatory', 'random'];

function SlackInterface() {
  usePageMeta({
    title: 'Slack Interface | Margin',
    description: 'An empty Slack-style workspace interface.',
    url: '/slack-interface',
    robots: 'noindex, nofollow',
  });

  return (
    <main className="slack-interface min-h-screen overflow-hidden bg-[#b9e5f8] p-3 font-sans text-[#292530] sm:p-6 lg:p-10">
      <div className="slack-interface__pattern pointer-events-none fixed inset-0 opacity-80" aria-hidden="true" />

      <section className="slack-window relative mx-auto flex h-[calc(100vh-24px)] min-h-[560px] w-full max-w-[1120px] flex-col overflow-hidden rounded-[7px] bg-white shadow-[0_25px_70px_rgba(39,55,76,0.26)] sm:h-[calc(100vh-48px)] lg:h-[640px]" aria-label="Slack workspace interface">
        <header className="flex h-8 shrink-0 items-center gap-3 bg-[#47134f] px-3 text-white sm:h-9 sm:px-4">
          <div className="flex w-[142px] shrink-0 items-center gap-2 text-[11px] font-semibold sm:w-[152px]">
            <span className="h-2 w-2 rounded-full bg-[#f4bd45]" aria-hidden="true" />
            <span>Meridian Bio</span>
            <span className="ml-auto text-[10px] text-white/75">⌄</span>
          </div>
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex h-5 w-full max-w-[420px] items-center justify-center gap-2 rounded-[4px] bg-[#6f3c72] px-3 text-[9px] text-white/85 shadow-inner sm:h-6 sm:text-[10px]">
              <Search className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span>Search Meridian Bio</span>
            </div>
          </div>
          <div className="w-[142px] shrink-0" aria-hidden="true" />
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[142px] shrink-0 bg-[#4a0c4f] px-2.5 py-3 text-white sm:w-[152px] sm:px-3.5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[-0.01em]">Meridian Bio</span>
              <button type="button" className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#4a0c4f] shadow-sm transition hover:bg-[#f4eaf5]" aria-label="Compose new message">
                <Pencil className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-3 text-[9px] leading-none text-white/65 sm:text-[10px]">
              <div>
                <p className="mb-2 font-medium text-white/75">Channels</p>
                <nav className="space-y-0.5" aria-label="Channels">
                  {channels.map((channel) => {
                    const active = channel === 'stability-ops';
                    return (
                      <button
                        key={channel}
                        type="button"
                        className={`flex h-5 w-full items-center gap-1.5 rounded-[2px] px-1.5 text-left transition ${active ? 'bg-[#0f86bd] font-bold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="text-[10px] text-white/75">#</span>
                        <span className="truncate">{channel}</span>
                        {active && <span className="ml-auto flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-1 text-[8px] font-bold text-[#1684b7]">1</span>}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-1">
                <p className="mb-2 font-medium text-white/75">Apps</p>
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
                <h1 className="truncate text-[11px] font-bold text-[#25232a] sm:text-[12px]"><span className="mr-1 text-[#55515a]">#</span>stability-ops</h1>
                <span className="hidden truncate text-[9px] text-[#817d83] sm:inline">Excursions, deviations, chamber alarms</span>
              </div>
              <button type="button" className="rounded p-1 text-[#817d83] transition hover:bg-[#f4f1f4] hover:text-[#4a0c4f]" aria-label="Start a huddle">
                <Headphones className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col">
              <div className="flex-1" aria-label="Empty channel message history" />
              <div className="px-4 pb-3 sm:px-5 sm:pb-4">
                <div className="overflow-hidden rounded-[4px] border border-[#d4d1d5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[#7c3b80] focus-within:ring-1 focus-within:ring-[#7c3b80]/20">
                  <div className="flex h-6 items-center gap-3 border-b border-[#f0edf0] px-2.5 text-[#aaa5ac] sm:h-7">
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add formatting"><span className="text-[11px] font-bold">B</span></button>
                    <button type="button" className="rounded text-[10px] italic hover:text-[#4a0c4f]" aria-label="Italicize message">I</button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add link"><span className="text-[10px]">↗</span></button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add list"><span className="text-[10px]">≡</span></button>
                    <button type="button" className="rounded hover:text-[#4a0c4f]" aria-label="Add code"><span className="text-[10px]">&lt;&gt;</span></button>
                  </div>
                  <div className="flex min-h-[48px] items-center px-2.5 text-[10px] text-[#8d8990] sm:min-h-[52px] sm:text-[11px]">Message #stability-ops</div>
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
