import { CustomizerClient } from '@/components/shop/CustomizerClient';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';

// Rute ini bergantung pada param request, tidak bisa masuk static shell.
export const instant = false;

export default async function CustomizerPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  return (
    <>
      <Header />
      <CustomizerClient templateId={templateId} />
      <Footer />
    </>
  );
}