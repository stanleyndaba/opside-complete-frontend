import { useEffect } from 'react';

type MetaConfig = {
  title: string;
  description: string;
  url?: string;
  image?: string;
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

export const usePageMeta = ({ title, description, url, image, preloadImages }: MetaConfig) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (title) document.title = title;
    updateMeta('description', description);
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    if (url) updateMeta('og:url', url, 'property');
    if (image) updateMeta('og:image', image, 'property');
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    if (image) updateMeta('twitter:image', image);
  }, [title, description, url, image]);

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


