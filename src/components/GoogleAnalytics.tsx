// Inyecta el snippet de Google Analytics 4 (gtag.js) en gounuri.com — la
// landing/marketing de la plataforma, NO una tienda de un tenant.
//
// A diferencia de tienda-core/GoogleAnalytics.tsx (que lee el Measurement ID
// por tenant desde store_config, porque cada tienda tiene su propia cuenta de
// Google), acá no hay multi-tenant ni Supabase de por medio: es un único
// sitio, un único Measurement ID, fijo por variable de entorno.
//
// Requiere NEXT_PUBLIC_GA_MEASUREMENT_ID configurada en Vercel
// (Project Settings > Environment Variables del proyecto gounuri-web).
// Si no está seteada, no renderiza nada — no rompe local/preview sin la env var.

import Script from 'next/script'

export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
