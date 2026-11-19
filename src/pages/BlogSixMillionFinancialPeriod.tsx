import { BlogArticlePage } from '@/components/blog/BlogArticlePage';
import { blogArticleBySlug } from '@/content/blogArticles';

export default function BlogSixMillionFinancialPeriod() {
  return <BlogArticlePage article={blogArticleBySlug['six-million-amazon-financial-period']} />;
}
