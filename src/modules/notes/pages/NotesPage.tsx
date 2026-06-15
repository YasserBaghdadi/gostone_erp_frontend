import { useState } from "react";
import { Loader2, ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSystemNotes, useResolveNote } from "@/hooks/useSystemNotes";
import { useCan } from "@/hooks/usePermissions";

export default function NotesPage() {
  const { can } = useCan();
  const [showResolved, setShowResolved] = useState(false);
  const { data: notes = [], isLoading } = useSystemNotes(
    showResolved ? undefined : { is_resolved: "false" },
  );
  const resolve = useResolveNote();

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">الملاحظات</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowResolved((v) => !v)}>
          {showResolved ? "إظهار غير المُعالَجة فقط" : "إظهار الكل"}
        </Button>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        ملاحظات النظام — تشمل المرفقات الضريبية غير المتوافقة وأسبابها.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p>لا توجد ملاحظات{showResolved ? "" : " غير مُعالَجة"}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Card
              key={n.id}
              className={n.is_resolved ? "opacity-70" : "border-r-4 border-r-destructive"}
            >
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {!n.is_resolved && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <span className="font-semibold">{n.title}</span>
                    {n.source_label && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {n.source_label}
                      </span>
                    )}
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="text-xs text-muted-foreground">
                    {n.kind_display} · {new Date(n.created_at).toLocaleString("ar-SA")}
                    {n.is_resolved && " · ✅ مُعالَجة"}
                  </p>
                </div>
                {!n.is_resolved && can("notes.resolve") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate(n.id)}
                  >
                    تمّت المعالجة
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
