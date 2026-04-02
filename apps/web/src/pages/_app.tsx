import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { TenantProvider } from '@/lib/tenant-context';
import '@/styles/globals.css';
import '@/styles/branding.css';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { slug } = router.query;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setIsLoading(false);
  }, []);

  // For multi-tenant pages, wrap with TenantProvider
  const isMultiTenantPage = router.pathname.startsWith('/[slug]');

  if (isLoading && isMultiTenantPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const AppComponent = isMultiTenantPage && slug ? (
    <TenantProvider slug={String(slug)}>
      <Component {...pageProps} />
    </TenantProvider>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <>
      {AppComponent}
      <Toaster position="bottom-center" />
    </>
  );
}
