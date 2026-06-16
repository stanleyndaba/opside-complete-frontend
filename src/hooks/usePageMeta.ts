import { useEffect } from 'react';

type MetaConfig = {
  title: string;
  description: string;
  url?: string;
  image?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  preloadImages?: string[];
};

const updateMeta = (key: string, value: string, attr: 'name' | 'property' = 'name') => {
  if (!value) return;
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const updateCanonical = (href?: string) => {
  if (!href) return;
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = 'canonical';
    document.head.appendChild(tag);
  }
  tag.href = href;
};

export const usePageMeta = ({
  title,
  description,
  url,
  image,
  canonical,
  robots,
  ogTitle,
  ogDescription,
  ogUrl,
  preloadImages
}: MetaConfig) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const resolvedOgTitle = ogTitle || title;
    const resolvedOgDescription = ogDescription || description;
    const resolvedOgUrl = ogUrl || url;

    if (title) document.title = title;
    updateMeta('description', description);
    updateMeta('robots', robots || 'index, follow, max-image-preview:large');
    updateCanonical(canonical || url);
    updateMeta('og:title', resolvedOgTitle, 'property');
    updateMeta('og:description', resolvedOgDescription, 'property');
    if (resolvedOgUrl) updateMeta('og:url', resolvedOgUrl, 'property');
    if (image) updateMeta('og:image', image, 'property');
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', resolvedOgTitle);
    updateMeta('twitter:description', resolvedOgDescription);
    if (image) updateMeta('twitter:image', image);
  }, [title, description, url, image, canonical, robots, ogTitle, ogDescription, ogUrl]);

  useEffect(() => {
    if (typeof document === 'undefined' || !preloadImages?.length) return;
    const appended: HTMLLinkElement[] = [];
    preloadImages.forEach((href) => {
      if (!href) return;
      const existing = document.querySelector<HTMLLinkElement>(`link[rel="preload"][href="${href}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
      appended.push(link);
    });
    return () => {
      appended.forEach(link => {
        if (link.parentElement) {
          link.parentElement.removeChild(link);
        }
      });
    };
  }, [preloadImages]);
};


