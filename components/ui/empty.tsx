import { LucideIcon } from "lucide-react";

export function Empty({
  Icon,
  title,
  description,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-16 w-16 rounded-3xl bg-primary-50 grid place-items-center mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h4 className="text-cardtitle font-semibold text-ink">{title}</h4>
      {description ? (
        <p className="mt-1.5 text-sm text-ink-muted max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
