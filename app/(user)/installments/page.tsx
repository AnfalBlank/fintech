import Link from "next/link";
import { CalendarClock, ChevronRight, Receipt } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatIDR, formatDate } from "@/lib/utils";
import { myInstallments } from "@/lib/mock-data";
import { Empty } from "@/components/ui/empty";

export default function InstallmentsPage() {
  if (myInstallments.length === 0) {
    return (
      <Card>
        <Empty
          Icon={Receipt}
          title="Belum ada cicilan"
          description="Mulai pengajuan pertama Anda hari ini."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Cicilan Saya</h1>
        <p className="text-ink-muted mt-1.5">
          Pantau progress dan riwayat pembayaran cicilan Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {myInstallments.map((ins) => {
          const progress = Math.round((ins.paid / ins.total) * 100);
          return (
            <Link
              key={ins.id}
              href={`/installments/${ins.id}`}
              className="block group"
            >
              <Card className="p-5 hover:shadow-float transition-shadow">
                <div className="flex gap-4">
                  <img
                    src={ins.product.image}
                    alt={ins.product.title}
                    className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink truncate">
                        {ins.product.title}
                      </p>
                      <Badge
                        tone={
                          ins.status === "completed"
                            ? "success"
                            : ins.status === "overdue"
                              ? "danger"
                              : "primary"
                        }
                      >
                        {ins.status === "completed"
                          ? "Lunas"
                          : ins.status === "overdue"
                            ? "Overdue"
                            : "Aktif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {ins.paidMonths} dari {ins.tenor} cicilan
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress
                    value={progress}
                    tone={ins.status === "completed" ? "success" : "primary"}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink-muted">
                      {formatIDR(ins.paid)} / {formatIDR(ins.total)}
                    </span>
                    <span className="font-semibold text-ink">
                      {progress}%
                    </span>
                  </div>
                </div>

                {ins.status !== "completed" ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Jatuh tempo {formatDate(ins.nextDueDate)}
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatIDR(ins.monthly)}
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-end text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                  Detail <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
