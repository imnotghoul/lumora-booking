import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="container-page py-10" aria-label="Загрузка">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56" />)}
      </div>
    </main>
  );
}
