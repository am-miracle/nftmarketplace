import Link from 'next/link';
import CustomButton from '@/components/custom/CustomButton';
import { ArrowBigRight } from 'lucide-react';


  export default async function NFTDetailPage() {

  return (
    <main className="">
      
        <div className='max-w-[1050px] mx-auto'>
            <div className='flex items-center justify-between'>
            <h1 className='text-4xl font-bold mb-12'>More from this artist</h1>
            <Link href={"/creators/creator"} className='hidden md:block'>
                <CustomButton
                type='button'
                title='Go To Artist Page'
                className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base'
                icon={<ArrowBigRight size={20} className="mr-3" />}
                />
            </Link>
            </div>
        <div>

        </div>
            <Link href={"/creators/creator"} className='block md:hidden'>
                <CustomButton
                    type='button'
                    title='Go To Artist Page'
                    className='bg-background border-2 border-solid border-accent mb-7 h-[60px] text-base w-full'
                    icon={<ArrowBigRight size={20} className="mr-3" />}
                />
            </Link>
        </div>
    </main>
  );
}