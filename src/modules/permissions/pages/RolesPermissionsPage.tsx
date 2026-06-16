import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useEmployeeGranted,
  useEmployeeOptions,
  usePermissionCatalog,
  useSaveEmployeePermissions,
  type CatalogScreen,
  type EmployeeOption,
} from "@/hooks/usePermissions";

function empLabel(e: EmployeeOption): string {
  const name = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return name || e.phone || `موظف #${e.id}`;
}

export default function RolesPermissionsPage() {
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: catalog = [] } = usePermissionCatalog();
  const { data: employees = [] } = useEmployeeOptions();
  const { data: granted, isFetching } = useEmployeeGranted(employeeId);
  const saveMutation = useSaveEmployeePermissions();

  // Load the employee's current grants into local editable state.
  useEffect(() => {
    setSelected(new Set(granted ?? []));
  }, [granted, employeeId]);

  const screenKeys = (screen: CatalogScreen) => screen.actions.map((a) => a.key);

  const toggle = (key: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const toggleScreen = (screen: CatalogScreen, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of screenKeys(screen)) on ? next.add(k) : next.delete(k);
      return next;
    });
  };

  const screenState = (screen: CatalogScreen): boolean | "indeterminate" => {
    const keys = screenKeys(screen);
    const n = keys.filter((k) => selected.has(k)).length;
    if (n === 0) return false;
    if (n === keys.length) return true;
    return "indeterminate";
  };

  const totalSelected = selected.size;
  const canSave = employeeId !== "" && !saveMutation.isPending;

  const handleSave = () => {
    if (employeeId === "") return;
    saveMutation.mutate({ employeeId: Number(employeeId), keys: Array.from(selected) });
  };

  const sectionCount = useMemo(
    () =>
      catalog.map((s) => ({
        section: s.section,
        total: s.screens.reduce((acc, sc) => acc + sc.actions.length, 0),
        on: s.screens.reduce(
          (acc, sc) => acc + sc.actions.filter((a) => selected.has(a.key)).length,
          0,
        ),
      })),
    [catalog, selected],
  );

  return (
    <div dir="rtl" className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">الأدوار والصلاحيات</h1>
        <p className="text-muted-foreground text-sm">
          اختر موظفاً ثم حدّد الصلاحيات المسموحة له على مستوى كل إجراء.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-2 min-w-[260px]">
            <Label>الموظف</Label>
            <Select
              value={employeeId === "" ? "" : String(employeeId)}
              onValueChange={(v) => setEmployeeId(v ? Number(v) : "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر موظفاً" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {empLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {employeeId !== "" && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary">المحدّد: {totalSelected}</Badge>
              <Button onClick={handleSave} disabled={!canSave}>
                {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {employeeId === "" ? (
        <p className="text-muted-foreground text-sm">اختر موظفاً لعرض الصلاحيات.</p>
      ) : isFetching ? (
        <p className="text-sm">جارٍ تحميل صلاحيات الموظف...</p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {catalog.map((section) => {
            const sc = sectionCount.find((x) => x.section === section.section);
            return (
              <AccordionItem
                key={section.section}
                value={section.section}
                className="rounded-lg border px-3"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2">
                    {section.section}
                    <Badge variant="outline">{sc?.on}/{sc?.total}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  {section.screens.map((screen) => (
                    <Card key={screen.key} className="border-border/60">
                      <CardHeader className="py-3">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <Checkbox
                            checked={screenState(screen)}
                            onCheckedChange={(v) => toggleScreen(screen, v === true)}
                          />
                          {screen.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {screen.actions.map((action) => (
                          <div
                            key={action.key}
                            className="flex items-center gap-2 rounded-md p-1 text-sm hover:bg-muted/40"
                          >
                            <Checkbox
                              id={`role-perm-${action.key}`}
                              checked={selected.has(action.key)}
                              onCheckedChange={(v) => toggle(action.key, v === true)}
                            />
                            <label htmlFor={`role-perm-${action.key}`} className="flex-1 cursor-pointer">
                              {action.label}
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
