import BrowserCategories from "@/components/sections/BrowserCategories";
import DiscoverMore from "@/components/sections/DiscoverMore";
import GetStarted from "@/components/sections/GetStarted";
import Hero from "@/components/sections/Hero";
import NftAuction from "@/components/sections/NftAuction";
import Subscribe from "@/components/sections/Subscribe";
import TopCreators from "@/components/sections/TopCreators";
import TrendingCollection from "@/components/sections/TrendingCollection";

export default function Home() {
  return (
    <div className="">
      <Hero />
      <TrendingCollection />
      <TopCreators />
      <BrowserCategories />
      <DiscoverMore />
      <NftAuction />
      <GetStarted />
      <Subscribe />
    </div>
  );
}
