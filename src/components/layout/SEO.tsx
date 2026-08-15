// components/SEO.tsx
import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description: string;
    canonicalUrl?: string;
    ogImage?: string;
}

export default function SEO({ title, description, canonicalUrl, ogImage }: SEOProps) {
    const siteName = "AILA Institute";
    const fullTitle = `${title} | ${siteName}`;
    const defaultOgImage = "/path-to-your-logo-or-banner.jpg"; // Use an absolute URL

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Canonical URL to prevent duplicate content issues */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph (for Facebook/LinkedIn previews) */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage || defaultOgImage} />
            <meta property="og:type" content="website" />

            {/* Twitter/X Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
}