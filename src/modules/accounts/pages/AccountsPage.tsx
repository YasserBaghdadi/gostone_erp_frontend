
import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Wallet, ChevronDown, ChevronLeft, Loader2, CornerDownLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAllAccounts, useExportAccountsExcel } from "@/hooks/useAccounts";
import { CreateAccountDialog } from "../components/CreateAccountDialog";
import type { Account } from "@/types";
import { cn } from "@/lib/utils";

interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
}

function buildTree(accounts: Account[]): AccountTreeNode[] {
  const map = new Map<number, AccountTreeNode>();
  const roots: AccountTreeNode[] = [];

  for (const account of accounts) {
    map.set(account.id, { ...account, children: [] });
  }

  for (const account of accounts) {
    const node = map.get(account.id)!;
    if (account.parent && map.has(account.parent)) {
      map.get(account.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Order every level by account number (the natural chart-of-accounts order).
  const sortByNumber = (nodes: AccountTreeNode[]) => {
    nodes.sort((a, b) =>
      (a.number || "").localeCompare(b.number || "", undefined, { numeric: true }),
    );
    for (const node of nodes) sortByNumber(node.children);
  };
  sortByNumber(roots);

  return roots;
}

function getParentName(accounts: Account[], parentId: number | null): string | null {
  if (!parentId) return null;
  const parent = accounts.find((a) => a.id === parentId);
  return parent?.name || parent?.number || null;
}

// --- Tree Row (Desktop) ---
function AccountTreeRow({
  node,
  depth,
  expandedIds,
  toggleExpand,
  onNavigate,
}: {
  node: AccountTreeNode;
  depth: number;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
  onNavigate: (id: number) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40"
        onClick={() => onNavigate(node.id)}
      >
        {/* Account Number */}
        <td className="px-4 py-3 font-mono font-medium whitespace-nowrap text-right">
          {node.number}
        </td>

        {/* Account Name with indent & expand */}
        <td className="px-4 py-3 text-right">
          <div className="flex items-center gap-1.5" style={{ paddingRight: `${depth * 24}px` }}>
            {depth > 0 && <CornerDownLeft className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center shrink-0 transition-colors"
                aria-label={isExpanded ? "طي" : "توسيع"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}
            <span className={cn(!node.name && "text-muted-foreground italic")}>
              {node.name || "بدون اسم"}
            </span>
            {hasChildren ? (
              <Badge variant="secondary" className="mr-2 bg-primary/10 text-primary border-none hover:bg-primary/20">حساب رئيسي</Badge>
            ) : (
              <Badge variant="outline" className="mr-2 text-muted-foreground">حساب فرعي</Badge>
            )}
            {hasChildren && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-1">
                {node.children.length}
              </Badge>
            )}
          </div>
        </td>

        {/* Balance */}
        <td className="px-4 py-3 text-center font-mono font-bold text-primary whitespace-nowrap">
          {parseFloat(node.balance || "0").toLocaleString()}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(node.id);
            }}
          >
            <FileText className="h-4 w-4 ml-1" />
            التفاصيل
          </Button>
        </td>
      </tr>

      {/* Render children if expanded */}
      {isExpanded &&
        node.children.map((child) => (
          <AccountTreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onNavigate={onNavigate}
          />
        ))}
    </>
  );
}

// --- Tree Card (Mobile) ---
function AccountTreeCard({
  node,
  depth,
  expandedIds,
  toggleExpand,
  onNavigate,
  allAccounts,
}: {
  node: AccountTreeNode;
  depth: number;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
  onNavigate: (id: number) => void;
  allAccounts: Account[];
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const parentName = getParentName(allAccounts, node.parent);

  return (
    <div style={{ paddingRight: `${depth * 16}px` }}>
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md transition-all",
          hasChildren && "border-primary/20"
        )}
        onClick={() => onNavigate(node.id)}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {depth > 0 && <CornerDownLeft className="h-4 w-4 text-muted-foreground shrink-0" />}
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.id);
                  }}
                  className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0"
                  aria-label={isExpanded ? "طي" : "توسيع"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </button>
              )}
              <Badge variant="outline" className="font-mono">
                #{node.number}
              </Badge>
              {hasChildren && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {node.children.length} حساب فرعي
                </Badge>
              )}
            </div>
            <span className="font-mono font-bold text-primary">
              {parseFloat(node.balance || "0").toLocaleString()} ر.س
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-semibold">
                {node.name || <span className="text-muted-foreground italic">بدون اسم</span>}
              </p>
              {hasChildren ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 text-[10px] px-1.5 py-0">حساب رئيسي</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">حساب فرعي</Badge>
              )}
            </div>
            {parentName && (
              <p className="text-xs text-muted-foreground">الحساب الرئيسي: {parentName}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2">
            <FileText className="h-4 w-4" />
            عرض التفاصيل
          </Button>
        </CardContent>
      </Card>

      {/* Render children if expanded */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <AccountTreeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onNavigate={onNavigate}
              allAccounts={allAccounts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Page ---
export default function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const search = searchParams.get("search") || "";

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const exportExcel = useExportAccountsExcel();

  const isSearching = search.length > 0;

  // We always fetch all accounts for the tree, so we can just filter them locally for search
  const { data: allAccounts, isLoading } = useAllAccounts();

  const searchResults = useMemo(() => {
    if (!allAccounts) return [];
    if (!search) return [];
    const term = search.toLowerCase();
    return allAccounts
      .filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(term)) ||
          (a.number && a.number.includes(term))
      )
      .sort((a, b) =>
        (a.number || "").localeCompare(b.number || "", undefined, { numeric: true })
      );
  }, [allAccounts, search]);

  const tree = useMemo(() => {
    if (!allAccounts) return [];
    return buildTree(allAccounts);
  }, [allAccounts]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSearch = (term: string) => {
    setSearchParams(term ? { search: term } : {});
  };

  const handleNavigate = (id: number) => {
    navigate(`/accounts/${id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            شجرة الحسابات
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الحسابات المالية وقيود اليومية</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="gap-2"
            disabled={exportExcel.isPending}
            onClick={() => exportExcel.mutate()}
          >
            {exportExcel.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            تصدير Excel
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="shadow-sm border-none ring-1 ring-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بحث باسم أو رقم الحساب..."
              className="pr-9"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isSearching ? (
            /* ---- Search Mode: Flat list ---- */
            <>
              {/* Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {searchResults.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    لا توجد نتائج
                  </div>
                ) : (
                  searchResults.map((account) => (
                    <Card
                      key={account.id}
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleNavigate(account.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono">
                            #{account.number}
                          </Badge>
                          <span className="font-mono font-bold text-primary">
                            {parseFloat(account.balance || "0").toLocaleString()} ر.س
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">
                            {account.name || (
                              <span className="text-muted-foreground italic">بدون اسم</span>
                            )}
                          </p>
                          {account.parent && allAccounts && (
                            <p className="text-xs text-muted-foreground mt-1">
                              الحساب الرئيسي: {getParentName(allAccounts, account.parent) || `#${account.parent}`}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <FileText className="h-4 w-4" />
                          عرض التفاصيل
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop */}
              <div className="hidden lg:block rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">رقم الحساب</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">اسم الحساب</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">الحساب الرئيسي</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">الرصيد</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="h-24 text-center text-muted-foreground">
                          لا توجد نتائج
                        </td>
                      </tr>
                    ) : (
                      searchResults.map((account) => (
                        <tr
                          key={account.id}
                          className="cursor-pointer hover:bg-muted/50 border-b border-border/40"
                          onClick={() => handleNavigate(account.id)}
                        >
                          <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">{account.number}</td>
                          <td className="px-4 py-3">
                            <span className={cn(!account.name && "text-muted-foreground italic")}>
                              {account.name || "بدون اسم"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {account.parent && allAccounts ? (
                              <span className="text-sm">{getParentName(allAccounts, account.parent) || `#${account.parent}`}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-primary whitespace-nowrap">
                            {parseFloat(account.balance || "0").toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(account.id);
                              }}
                            >
                              <FileText className="h-4 w-4 ml-1" />
                              التفاصيل
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* ---- Tree Mode ---- */
            <>
              {/* Mobile */}
              <div className="space-y-3 lg:hidden">
                {tree.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">لا توجد حسابات</div>
                ) : (
                  tree.map((node) => (
                    <AccountTreeCard
                      key={node.id}
                      node={node}
                      depth={0}
                      expandedIds={expandedIds}
                      toggleExpand={toggleExpand}
                      onNavigate={handleNavigate}
                      allAccounts={allAccounts || []}
                    />
                  ))
                )}
              </div>

              {/* Desktop */}
              <div className="hidden lg:block rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-[150px]">رقم الحساب</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">اسم الحساب</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">الرصيد</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tree.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="h-24 text-center text-muted-foreground">
                          لا توجد حسابات
                        </td>
                      </tr>
                    ) : (
                      tree.map((node) => (
                        <AccountTreeRow
                          key={node.id}
                          node={node}
                          depth={0}
                          expandedIds={expandedIds}
                          toggleExpand={toggleExpand}
                          onNavigate={handleNavigate}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreateAccountDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
