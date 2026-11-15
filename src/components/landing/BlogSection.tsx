import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const articles = [
  {
    eyebrow: "Provider accountability",
    title: "Your Amazon recovery provider says the work is done. Can Finance verify the outcome?",
    audience:
      "CFOs, Controllers, Finance Directors and established Amazon brands already using recovery providers",
    href: "/blog/provider-accountability",
  },
  {
    eyebrow: "Operational complexity",
    title: "As your Amazon operation grows, can your financial controls keep up?",
    audience:
      "COOs, Heads of Marketplace Operations, Finance Directors and established FBA brands.",
    href: "/blog/operational-complexity",
  },
  {
    eyebrow: "Financial-period closure",
    title: "What does a properly closed Amazon financial period actually look like?",
    audience:
      "CFOs, Controllers, Financial Directors and enterprise Amazon businesses.",
    href: "/blog/financial-period-closure",
  },
] as const;

export function BlogSection() {
  return (
    <section
      className="relative bg-[#F7F8F7] py-14 sm:py-18 md:py-24"
      aria-labelledby="landing-blog-title"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="max-w-[680px]">
            <p className="font-mono text-[5.5px] font-semibold uppercase tracking-tight text-[#F05A3C]">
              BLOG
            </p>
            <h2
              id="landing-blog-title"
              className="mt-3 font-lora text-[34px] font-normal leading-[1.04] tracking-[-0.045em] text-[#182026] sm:text-[44px] md:text-[52px]"
            >
              The questions behind better Amazon financial control.
            </h2>
          </div>
          <p className="max-w-[340px] text-[14px] leading-6 text-[#66737F] md:pb-1">
            Practical perspectives for the people responsible for recovery, reconciliation and financial confidence.
          </p>
        </div>

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:gap-5">
          {articles.map((article) => (
            <article
              key={article.title}
              className="group flex min-h-[250px] w-[min(85vw,380px)] shrink-0 snap-start flex-col rounded-[14px] bg-white p-5 shadow-none transition-transform duration-200 hover:-translate-y-1 sm:p-6"
            >
              <p className="font-mono text-[11px] font-medium tracking-tight text-[#F05A3C]">
                {article.eyebrow}
              </p>
              <h3 className="mt-5 max-w-[360px] font-lora text-[25px] font-normal leading-[1.08] tracking-[-0.04em] text-[#182026] sm:text-[29px]">
                {article.title}
              </h3>
              <p className="mt-5 max-w-[370px] text-[12px] leading-5 text-[#71808A]">
                {article.audience}
              </p>
              <div className="mt-auto flex flex-col items-start gap-2 pt-7">
                <span className="text-[11px] font-medium tracking-tight text-[#71808A]">3 min read</span>
                <Link
                  to={article.href}
                  className="inline-flex items-center gap-1 text-[10px] font-normal text-[#F05A3C] no-underline transition-colors hover:text-[#D9472D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A3C]/35 focus-visible:ring-offset-2"
                  aria-label={`Read now: ${article.title}`}
                >
                  Read now <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
