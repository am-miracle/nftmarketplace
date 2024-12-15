import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default async function CategoryPage({
  params,
}: {
  params: { categoryId: string };
}) {
  const { categoryId } = await params;

  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto'>
        <div className='my-10 px-4'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">NFT Listing</h1>
          <p className='text-xl xl:text-2xl mb-7'>Browse through more than 50k NFTs on the NFT Marketplace.</p>
        </div>
      </section>
      <div className="mt-8">
        <Suspense fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <h1>{categoryId}</h1>
        </Suspense>
      </div>
    </main>
  );
}