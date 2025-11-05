import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";

interface LanguageColumnToggleProps {
  activeLanguages: string[];
  onToggle: (languages: string[]) => void;
}

const OPTIONAL_LANGUAGES = [
  { code: "es", label: "Spanish" },
  { code: "az", label: "Azerice" },
];

export function LanguageColumnToggle({
  activeLanguages,
  onToggle,
}: LanguageColumnToggleProps) {
  const toggleLanguage = (code: string) => {
    if (activeLanguages.includes(code)) {
      onToggle(activeLanguages.filter((l) => l !== code));
    } else {
      onToggle([...activeLanguages, code]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Language Column
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Language Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked
          disabled
          onSelect={(e) => e.preventDefault()}
        >
          English (always visible)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked
          disabled
          onSelect={(e) => e.preventDefault()}
        >
          Arabic (always visible)
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {OPTIONAL_LANGUAGES.map((lang) => (
          <DropdownMenuCheckboxItem
            key={lang.code}
            checked={activeLanguages.includes(lang.code)}
            onCheckedChange={() => toggleLanguage(lang.code)}
          >
            {lang.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
