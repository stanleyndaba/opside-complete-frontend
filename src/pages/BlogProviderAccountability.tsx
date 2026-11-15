import { BlogArticlePage } from '@/components/blog/BlogArticlePage';
import { blogArticleBySlug } from '@/content/blogArticles';

export default function BlogProviderAccountability() {
  return <BlogArticlePage article={blogArticleBySlug['provider-accountability']} />;
}
