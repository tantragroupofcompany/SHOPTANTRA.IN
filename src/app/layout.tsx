import '../index.css';


export const metadata = {
  title: 'ShopTantra - Best Online Marketplace in India to Buy & Sell',
  description: 'ShopTantra is India\'s #1 multi-vendor marketplace to buy and sell products online. Connect with verified sellers, get the best deals, and start your own online store today.',
  keywords: 'buy and sell online, best marketplace india, multi vendor store, online shopping india, sell products online, shoptantra',
  icons: {
    icon: '/SHOPTANTRA.png',
  },
  alternates: {
    canonical: 'https://shoptantra.in',
  },
  openGraph: {
    title: 'ShopTantra - Best Online Marketplace in India to Buy & Sell',
    description: 'ShopTantra is India\'s #1 multi-vendor marketplace to buy and sell products online. Connect with verified sellers, get the best deals, and start your own online store today.',
    url: 'https://shoptantra.in',
    siteName: 'ShopTantra',
    images: [
      {
        url: 'https://shoptantra.in/SHOPTANTRA.png',
        width: 1200,
        height: 630,
        alt: 'ShopTantra Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopTantra - Best Online Marketplace in India to Buy & Sell',
    description: 'ShopTantra connects verified local sellers and buyers across India with escrow payouts.',
    images: ['https://shoptantra.in/SHOPTANTRA.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SHOPTANTRA" />
        <link rel="apple-touch-icon" href="/SHOPTANTRA.png" />
        {/* Razorpay Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async defer></script>
        {/* Load Inter and Outfit fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: 'Inter', sans-serif;
            --font-outfit: 'Outfit', sans-serif;
          }
          body {
            font-family: var(--font-inter), sans-serif;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-outfit), var(--font-inter), sans-serif;
          }
        `}} />
      </head>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'name': 'ShopTantra',
              'url': 'https://shoptantra.in',
              'potentialAction': {
                '@type': 'SearchAction',
                'target': 'https://shoptantra.in/products?search={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </body>
    </html>
  );
}
