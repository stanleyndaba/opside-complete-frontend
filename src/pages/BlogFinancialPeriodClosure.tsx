import { BlogArticlePage } from '@/components/blog/BlogArticlePage';
import { blogArticleBySlug } from '@/content/blogArticles';

export default function BlogFinancialPeriodClosure() {
  return <BlogArticlePage article={blogArticleBySlug['financial-period-closure']} />;
}
