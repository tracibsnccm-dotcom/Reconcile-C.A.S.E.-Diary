import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonCard = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-16 w-1/4" />
          <Skeleton className="h-16 w-1/4" />
          <Skeleton className="h-16 w-1/4" />
          <Skeleton className="h-16 w-1/4" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
};
