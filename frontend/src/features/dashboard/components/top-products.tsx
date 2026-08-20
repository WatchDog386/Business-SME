import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { EmptyState } from '@/components/ui/empty-state';
import { formatKES } from '@/lib/utils';

export function TopProducts({
  products,
}: {
  products: DashboardData['topProducts'];
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          Top sellers — last 30 days
        </h2>
        <Link to="/products" className="text-sm font-semibold text-accent hover:text-accent-strong">
          See All
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Trophy}
            title="No sales yet"
            description="Your best-selling products and services will appear here."
          />
        </div>
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product, index) => (
            <div
              key={product.name}
              className="min-w-[160px] flex-1 basis-40 rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 shadow-sm flex flex-col text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00B140]/10 text-xs font-bold text-[#00B140]">
                {index + 1}
              </span>
              <p className="mt-3 truncate text-sm font-semibold text-white">
                {product.name}
              </p>
              <p className="text-xs text-zinc-400">
                {Number(product.quantity)} sold
              </p>
              <p className="mt-auto pt-3 text-sm font-bold text-white">
                {formatKES(Number(product.revenue))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}