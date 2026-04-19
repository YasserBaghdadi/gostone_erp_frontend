import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "بحث...", 
  className,
  ariaLabel = "بحث"
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full md:w-64", className)} role="search">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-9 rounded-xl border-muted-foreground/20 bg-background/50 focus:bg-background transition-all h-10"
        aria-label={ariaLabel}
      />
    </div>
  );
}
