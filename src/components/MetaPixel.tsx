// Inyecta el Meta Pixel en gounuri.com — la landing/marketing de la
// plataforma, NO una tienda de un tenant.
//
// A diferencia de tienda-core/MetaPixel.tsx (que lee el Pixel ID por tenant
// desde store_config, porque cada tienda tiene su propio pixel), acá no hay
// multi-tenant ni Supabase de por medio: es un único sitio, un único Pixel
// ID, fijo por variable de entorno.
//
// Requiere NEXT_PUBLIC_META_PIXEL_ID configurada en Vercel
// (Project Settings > Environment Variables del proyecto gounuri-web).
// Si no está seteada, no renderiza nada — no rompe local/preview sin la env var.

import Script from 'next/script'

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  if (!pixelId) return null

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
