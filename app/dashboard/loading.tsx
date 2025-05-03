import DashboardSkeleton from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent">
        <DashboardSkeleton />
      </div>
    </div>
  );
}

Loading.displayName = 'Loading';
