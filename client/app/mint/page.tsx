import MintNFTForm from "@/components/MintNFTForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create NFT",
  description: "Create and mint your NFT",
}


const MintPage = async () => {

  return (
    <main className="">
      <section className='max-w-[1050px] mx-auto'>
        <div className='my-10 px-4'>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold mb-3">Create NFT</h1>
          <p className='text-xl xl:text-2xl mb-7'>Create and mint your NFT</p>
        </div>
      </section>
      <hr className='border-primary mb-0' />
      <section className='my-10 px-4 w-full max-w-[1050px] mx-auto text-primary pt-4 ease-in-out duration-300'>
        <MintNFTForm />
      </section>
    </main>
 );
};

export default MintPage;