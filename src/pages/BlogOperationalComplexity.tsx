import { BlogArticlePage } from '@/components/blog/BlogArticlePage';
import { blogArticleBySlug } from '@/content/blogArticles';

export default function BlogOperationalComplexity() {
  return <BlogArticlePage article={blogArticleBySlug['operational-complexity']} />;
}
