import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchIcon } from 'lucide-react'
import React from 'react'

const SearchNft = () => {
  return (
    <form className="border border-primary rounded-[20px] h-[60px] overflow-hidden">
        <Label htmlFor="search" className="block mb-2 text-sm font-medium text-gray-900 sr-only">Search</Label>
            <div className="relative flex items-center">
              <input
                  type={"search"}
                  id={"search"}
                  className="bg-background focus:outline-none focus:border-none rounded-[20px] h-[60px] text-base text-white w-full pe-12 p-5 placeholder:text-primary"
                  placeholder={"Search your favorite NFTs"}
              />
              <div>
                <Button type="submit" className='bg-transparent'>
                  <SearchIcon
                      size={24}
                      className="w-6 h-6 text-white"
                  />
                </Button>
              </div>
        </div>
    </form>
  )
}

export default SearchNft;