import { useEffect } from 'react';

/**
 * Custom React hook to dynamically update page title for SEO
 * @param {string} title - Page specific SEO title
 * @param {string} [metaDescription] - Optional page specific meta description
 */
export default function useDocumentTitle(title, metaDescription) {
  useEffect(() => {
    // Save previous title
    const prevTitle = document.title;
    
    if (title) {
      document.title = `${title} | M Cube's Cafe`;
    }

    if (metaDescription) {
      let metaDescElement = document.querySelector('meta[name="description"]');
      if (metaDescElement) {
        metaDescElement.setAttribute('content', metaDescription);
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, metaDescription]);
}
