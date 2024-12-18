import { LoadingGrid } from '@/components/loading';
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default async function CreatorPage() {

  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto px-8 md:px-11 lg:px-36 xl:px-0'>
        <div className='my-10'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">Top Creators</h1>
          <p className='text-xl xl:text-2xl mb-7'>Check out top ranking NFT artists on the NFT Marketplace.</p>
        </div>
      </section>
      <hr className='border-primary mb-0' />
      <section className='mt-8 px-8 md:px-11 lg:px-36 xl:px-0'>
      <Tabs defaultValue="nft" className="w-full">
        <TabsList className='w-full max-w-[1050px] mx-auto text-primary flex items-center justify-evenly pt-4 ease-in-out duration-300'>
          <TabsTrigger
            value="today"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            Today
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            This Week
            </TabsTrigger>
            <TabsTrigger
            value="month"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            This Month
          </TabsTrigger>
          <TabsTrigger
            value="allTime"
            className='data-[state=active]:border-b-2 data-[state=active]:border-primary w-full text-lg xl:text-2xl font-semibold'
          >
            All Time
          </TabsTrigger>
        </TabsList>
        <TabsContent value="today" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
              <Suspense fallback={<LoadingGrid />}>
                <div className="text-center py-10">
                  <h2 className="text-2xl xl:text-3xl font-semibold mb-3
                  ">Top Creators Today</h2>
                </div>
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="week" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
            <Suspense fallback={<LoadingGrid />}>
              <div className="text-center py-10">
                  <h2 className="text-xl font-semibold">
                    Top Creators this week
                </h2>
              </div>
            </Suspense>
          </div>
          </TabsContent>
          <TabsContent value="month" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
            <Suspense fallback={<LoadingGrid />}>
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold">Top Creators this month</h2>
              </div>
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="allTime" className='bg-secondary h-full border-b border-background'>
          <div className='max-w-[1050px] mx-auto'>
            <Suspense fallback={<LoadingGrid />}>
              <div className="text-center py-10">
                <h2 className="text-xl font-semibold">Top Creators all time</h2>
              </div>
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
      </section>
    </main>
  );
}