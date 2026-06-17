export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} style={style} />;
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-7"
          style={{ width: `${60 + (i % 3) * 15}%`, marginLeft: i % 3 === 0 ? 0 : '16px' }}
        />
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] space-y-4 px-20 py-12">
      <Skeleton className="h-9 w-2/3" />
      <div className="mt-8 space-y-2">
        {[100, 80, 95, 70, 85].map((w, i) => (
          <Skeleton key={i} className="h-5" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
