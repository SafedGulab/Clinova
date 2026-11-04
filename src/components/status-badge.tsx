const styles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-teal/10 text-teal",
  CANCELLED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-blue-50 text-blue-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status] ?? styles.PENDING}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
