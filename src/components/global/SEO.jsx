import React, { useEffect } from 'react';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  } else {
    el.setAttribute('href', href);
  }
  return el;
}

const SEO = ({
  title,
  description,
  canonical,
  openGraph = {},
  twitter = {},
  jsonLd,
}) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: description,
      });
    }

    // Canonical
    if (canonical) upsertLink('canonical', canonical);

    // Open Graph
    const ogTitle = openGraph.title || title;
    const ogDesc = openGraph.description || description;
    const ogUrl = openGraph.url || canonical || window.location.href;
    const ogImage = openGraph.image;

    if (ogTitle)
      upsertMeta('meta[property="og:title"]', {
        property: 'og:title',
        content: ogTitle,
      });
    if (ogDesc)
      upsertMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: ogDesc,
      });
    if (ogUrl)
      upsertMeta('meta[property="og:url"]', {
        property: 'og:url',
        content: ogUrl,
      });
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    });
    if (ogImage)
      upsertMeta('meta[property="og:image"]', {
        property: 'og:image',
        content: ogImage,
      });

    // Twitter
    const twCard = twitter.card || 'summary_large_image';
    const twTitle = twitter.title || title;
    const twDesc = twitter.description || description;
    const twImage = twitter.image || ogImage;

    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: twCard,
    });
    if (twTitle)
      upsertMeta('meta[name="twitter:title"]', {
        name: 'twitter:title',
        content: twTitle,
      });
    if (twDesc)
      upsertMeta('meta[name="twitter:description"]', {
        name: 'twitter:description',
        content: twDesc,
      });
    if (twImage)
      upsertMeta('meta[name="twitter:image"]', {
        name: 'twitter:image',
        content: twImage,
      });

    // JSON-LD schema
    const prev = document.getElementById('seo-jsonld');
    if (prev) prev.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'seo-jsonld');
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      script.textContent = JSON.stringify(payload);
      document.head.appendChild(script);
    }
  }, [
    title,
    description,
    canonical,
    openGraph.title,
    openGraph.description,
    openGraph.url,
    openGraph.image,
    twitter.card,
    twitter.title,
    twitter.description,
    twitter.image,
    jsonLd,
  ]);

  return null;
};

export default SEO;
