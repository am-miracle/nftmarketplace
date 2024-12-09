'use client';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  total?: number;
  pages: number;
  current: number;
}

export function Pagination({ pages, current }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return params.toString();
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <Button
        variant="outline"
        disabled={current <= 1}
        onClick={() => {
          router.push(`?${createQueryString(current - 1)}`);
        }}
      >
        Previous
      </Button>

      <div className="flex items-center gap-2">
        {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={page === current ? "default" : "outline"}
            onClick={() => {
              router.push(`?${createQueryString(page)}`);
            }}
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        disabled={current >= pages}
        onClick={() => {
          router.push(`?${createQueryString(current + 1)}`);
        }}
      >
        Next
      </Button>
    </div>
  );
}