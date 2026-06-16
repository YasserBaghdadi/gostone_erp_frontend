import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CatalogScreen, CatalogSection } from "@/hooks/usePermissions";

interface PermissionCatalogPickerProps {
  catalog: CatalogSection[];
  /** Currently selected action keys. */
  selected: Set<string>;
  /** Called with the next full set of selected keys. */
  onChange: (next: Set<string>) => void;
}

/**
 * Organized Arabic permission picker (sections → screens → actions) shared by
 * the roles screen and the employee form, so both show the same agreed layout
 * instead of a flat list of raw group names.
 */
export function PermissionCatalogPicker({ catalog, selected, onChange }: PermissionCatalogPickerProps) {
  const screenKeys = (screen: CatalogScreen) => screen.actions.map((a) => a.key);

  const toggle = (key: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(key); else next.delete(key);
    onChange(next);
  };

  const toggleScreen = (screen: CatalogScreen, on: boolean) => {
    const next = new Set(selected);
    for (const k of screenKeys(screen)) {
      if (on) next.add(k); else next.delete(k);
    }
    onChange(next);
  };

  const screenState = (screen: CatalogScreen): boolean | "indeterminate" => {
    const keys = screenKeys(screen);
    const n = keys.filter((k) => selected.has(k)).length;
    if (n === 0) return false;
    if (n === keys.length) return true;
    return "indeterminate";
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
    <Accordion type="multiple" className="space-y-2">
      {catalog.map((section) => {
        const sc = sectionCount.find((x) => x.section === section.section);
        return (
          <AccordionItem key={section.section} value={section.section} className="rounded-lg border px-3">
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
                          id={`perm-${action.key}`}
                          checked={selected.has(action.key)}
                          onCheckedChange={(v) => toggle(action.key, v === true)}
                        />
                        <label htmlFor={`perm-${action.key}`} className="flex-1 cursor-pointer">
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
  );
}
