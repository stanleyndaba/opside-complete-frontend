import { ArrowRight, Check, FileCheck2, Link2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BlogArticle, blogArticleBySlug } from '@/content/blogArticles';

type Props = {
  article: BlogArticle;
};

function ArticleBlock({ block }: { block: BlogArticle['sections'][number] }) {
  if (block.type === 'heading') {
    return <h2 className="mt-12 font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.035em] text-[#30343B] sm:text-[42px] md:text-[52px]">{block.text}</h2>;
  }

  if (block.type === 'list') {
    return (
      <ul className="mt-6 space-y-3 border-l-2 border-[#F05A3C]/30 pl-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7 md:text-[17px] md:leading-8">
        {block.items.map((item) => <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#F05A3C]">{item}</li>)}
      </ul>
    );
  }

  if (block.type === 'questions') {
    return (
      <div className="mt-7 grid gap-3 md:grid-cols-2">
        {block.items.map((item) => (
          <article key={item.question} className="bg-white p-5 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:p-6">
            <h3 className="text-[15px] font-semibold leading-5 text-[#30343B] sm:text-[16px]">{item.question}</h3>
            <p className="mt-3 text-[13px] leading-[1.5] text-[#667177] sm:text-[14px] sm:leading-6 md:text-[15px] md:leading-7">{item.answer}</p>
          </article>
        ))}
      </div>
    );
  }

  if (block.type === 'numbered') {
    return (
      <div className="mt-7 grid gap-3">
        {block.items.map((item, index) => (
          <article key={item.title} className="flex gap-4 bg-white p-5 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:gap-6 sm:p-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F5F4] font-mono text-[11px] font-semibold text-[#F05A3C]">{String(index + 1).padStart(2, '0')}</span>
            <div><h3 className="text-[16px] font-semibold leading-5 text-[#30343B] sm:text-[17px]">{item.title}</h3><p className="mt-3 text-[13px] leading-[1.5] text-[#667177] sm:text-[14px] sm:leading-6 md:text-[15px] md:leading-7">{item.body}</p></div>
          </article>
        ))}
      </div>
    );
  }

  return <p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7 md:text-[17px] md:leading-8">{block.text}</p>;
}

export function BlogArticlePage({ article }: Props) {
  usePageMeta({
    title: `${article.title} | Margin`,
    description: article.description,
    url: `${SITE_META.url}/blog/${article.slug}`,
    image: SITE_META.image,
  });

  const relatedArticles = article.related.map((slug) => blogArticleBySlug[slug]).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-12%] top-[-14%] h-[520px] w-[520px] rounded-full bg-[#EDEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] md:items-end md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[780px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">{article.eyebrow}</p>
              <h1 className="max-w-[780px] font-lora text-[34px] font-normal leading-[0.98] tracking-[-0.045em] text-[#30343B] min-[390px]:text-[39px] sm:text-[51px] md:text-[63px] lg:text-[71px]">{article.title}</h1>
              <p className="mt-7 max-w-[690px] text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7 md:text-[17px] md:leading-8">{article.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-[#667177]">
                <span>{article.readTime}</span>
                <span className="h-1 w-1 rounded-full bg-[#F05A3C]" aria-hidden="true" />
                <span>{article.audience}</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-[#F4F5F4] p-5 shadow-[0_22px_65px_rgba(48,52,59,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#DDE2E1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><ShieldCheck className="h-5 w-5" strokeWidth={1.6} /></div>
                  <div><p className="text-[12px] font-semibold text-[#30343B]">Margin perspective</p><p className="mt-0.5 text-[10px] text-[#F05A3C]">Independent financial assurance</p></div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#4D7869]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D7869]" /> Read now</span>
              </div>
              <div className="space-y-2.5 pt-4">
                <div className="flex items-center gap-3 rounded-[3px] bg-white px-3.5 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F0] text-[#4D7869]"><FileCheck2 className="h-4 w-4" strokeWidth={1.7} /></div><div><p className="text-[12px] font-semibold text-[#30343B]">Evidence connected</p><p className="mt-0.5 text-[10px] text-[#F05A3C]">Records remain inspectable</p></div></div>
                <div className="flex items-center gap-3 rounded-[3px] bg-white px-3.5 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F0] text-[#4D7869]"><Link2 className="h-4 w-4" strokeWidth={1.7} /></div><div><p className="text-[12px] font-semibold text-[#30343B]">Outcome traceable</p><p className="mt-0.5 text-[10px] text-[#F05A3C]">Settlement and close visible</p></div></div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#DDE2E1] pt-4 text-[10px] leading-4 text-[#F05A3C]"><Check className="h-3.5 w-3.5 shrink-0" /> Financial questions stay connected to their records.</div>
            </div>
          </div>
        </section>

        <article className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] md:gap-14 md:px-8 lg:px-10 2xl:px-12">
            <aside className="h-fit md:sticky md:top-28">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Margin insights</p>
              <p className="mt-4 max-w-[300px] font-lora text-[12px] leading-[1.45] tracking-[-0.02em] text-[#30343B] sm:text-[20px] sm:leading-[1.12]">The financial outcome deserves its own evidence trail.</p>
              <Link to="/audit-start" className="mt-7 inline-flex items-center gap-2 rounded-[7px] bg-[#F05A3C] px-5 py-3 text-[15px] font-semibold leading-none text-white transition-colors hover:bg-[#D9472D] sm:text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">Get Your Free Recovery Audit <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </aside>
            <div className="min-w-0 max-w-[760px]">
              {article.sections.map((block, index) => <ArticleBlock key={`${block.type}-${index}`} block={block} />)}
            </div>
          </div>
        </article>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Take the next step</p><h2 className="mt-4 font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.035em] text-[#30343B] sm:text-[44px] md:text-[58px]">{article.ctaHeading}</h2><p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7 md:text-[17px] md:leading-8">{article.ctaBody}</p></div>
              <div className="flex items-center bg-[#F4F5F4] p-6 sm:p-8"><div><p className="text-[13px] font-semibold leading-[1.5] text-[#30343B] sm:text-[15px] sm:leading-7 md:text-[17px] md:leading-8">Start with an independent examination of what your Amazon records establish.</p><Link to="/audit-start" className="mt-6 inline-flex items-center gap-2 rounded-[7px] bg-[#F05A3C] px-5 py-3 text-[15px] font-semibold leading-none text-white transition-colors hover:bg-[#D9472D] sm:text-[13px]">Get Your Free Recovery Audit <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><p className="mt-4 max-w-[560px] text-[11px] leading-5 text-[#8A9498]">{article.disclaimer}</p></div></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-14 sm:py-18 md:py-20">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Continue reading</p>
            <h2 className="mt-4 font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.035em] text-[#30343B] sm:text-[44px] md:text-[52px]">More from Margin.</h2>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {relatedArticles.map((related) => <Link key={related.slug} to={`/blog/${related.slug}`} className="group bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] transition-shadow hover:shadow-[0_12px_30px_rgba(48,52,59,0.08)]"><p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">{related.eyebrow}</p><h3 className="mt-4 font-lora text-[22px] leading-[1.1] tracking-[-0.025em] text-[#30343B] sm:text-[29px]">{related.title}</h3><span className="mt-6 inline-flex items-center gap-1 text-[11px] font-semibold text-[#F05A3C]">Read now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span></Link>)}
            </div>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
