// Utility to dynamically manage document head tags, OpenGraph, Twitter Cards, Canonical links, and JSON-LD structured data for Google SEO & Social Sharing
import siteConfig from '../config/siteConfig.js';

export function updatePageSEO({
  title,
  description,
  permalink,
  image,
  category,
  author,
  date,
  keywords,
  type = 'article',
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const postTitle = title || siteConfig.name;
  const finalTitle = title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} - ${siteConfig.tagline}`;
  const finalDesc = description || siteConfig.description;
  const canonicalUrl = permalink
    ? `${siteUrl}/blog/${permalink}`
    : typeof window !== 'undefined'
    ? window.location.href
    : '';

  let finalImage = image;
  if (!finalImage) {
    finalImage = `${siteUrl}/src/assets/images/hero_urban_avenue_1790847328166.jpg`;
  } else if (!finalImage.startsWith('http://') && !finalImage.startsWith('https://')) {
    finalImage = `${siteUrl}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
  }

  // 1. Update Document Title
  document.title = finalTitle;

  // Helper to set or create meta tag
  const setMetaTag = (attributeName, attributeValue, content) => {
    if (!content) return;
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Standard Search Engine Meta
  setMetaTag('name', 'description', finalDesc);
  if (keywords) {
    setMetaTag('name', 'keywords', keywords);
  }
  if (author) {
    setMetaTag('name', 'author', author);
  }

  // 3. Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 4. OpenGraph Tags (Facebook, WhatsApp, LinkedIn, Discord, Telegram, Slack, iMessage)
  setMetaTag('property', 'og:site_name', siteConfig.name);
  setMetaTag('property', 'og:title', postTitle);
  setMetaTag('property', 'og:description', finalDesc);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:image', finalImage);
  setMetaTag('property', 'og:image:secure_url', finalImage);
  setMetaTag('property', 'og:image:alt', postTitle);
  if (date) setMetaTag('property', 'article:published_time', date);
  if (author) setMetaTag('property', 'article:author', author);
  if (category) setMetaTag('property', 'article:section', category);

  // 5. Twitter / X Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', postTitle);
  setMetaTag('name', 'twitter:description', finalDesc);
  setMetaTag('name', 'twitter:image', finalImage);
  setMetaTag('name', 'twitter:image:alt', postTitle);

  // 6. Schema.org JSON-LD Structured Data
  const jsonLdId = 'crazyblog-jsonld-schema';
  let scriptElement = document.getElementById(jsonLdId);
  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.id = jsonLdId;
    scriptElement.type = 'application/ld+json';
    document.head.appendChild(scriptElement);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'BlogPosting' : 'WebSite',
    headline: postTitle,
    description: finalDesc,
    image: [finalImage],
    url: canonicalUrl,
    datePublished: date || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: author || siteConfig.author || 'Admin',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  scriptElement.textContent = JSON.stringify(structuredData, null, 2);
}

// Reset head to site default when component unmounts
export function resetPageSEO() {
  document.title = `${siteConfig.name} - Horror Stories, Amazing Facts & Knowledge Base`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', siteConfig.description);

  const jsonLd = document.getElementById('crazyblog-jsonld-schema');
  if (jsonLd) jsonLd.remove();
}
