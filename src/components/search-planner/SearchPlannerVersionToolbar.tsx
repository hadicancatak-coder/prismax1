import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, GitCompare, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  version_number: number;
  status: 'live' | 'paused' | 'archived' | 'draft';
  created_at: string;
}

interface SearchPlannerVersionToolbarProps {
  adName: string;
  onNameChange: (name: string) => void;
  currentVersion?: Version;
  versions?: Version[];
  onVersionSelect?: (version: Version) => void;
  onNewVersion?: () => void;
  onCompare?: () => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
}

export function SearchPlannerVersionToolbar({
  adName,
  onNameChange,
  currentVersion,
  versions = [],
  onVersionSelect,
  onNewVersion,
  onCompare,
  isEditMode,
  onEditModeToggle,
}: SearchPlannerVersionToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(adName);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  const handleNameSave = () => {
    onNameChange(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(adName);
    setIsEditingName(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex items-center justify-between p-md border-b border-border bg-card">
      {/* Left: Ad Name (editable) */}
      <div className="flex items-center gap-sm">
        {isEditingName ? (
          <div className="flex items-center gap-xs">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="h-9 text-heading-md font-semibold bg-background border-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') handleNameCancel();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:bg-success/10"
              onClick={handleNameSave}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-muted"
              onClick={handleNameCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-xs group">
            <h2 className="text-heading-md font-semibold text-foreground">
              {adName || "Untitled Ad"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-smooth"
              onClick={() => {
                setTempName(adName);
                setIsEditingName(true);
              }}
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* Middle: Version Selector */}
      <div className="flex items-center gap-sm">
        {currentVersion && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-xs h-9 transition-smooth">
                <span className="text-body-sm font-medium">
                  v{currentVersion.version_number}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(currentVersion.status)}
                  className="text-metadata px-xs py-0"
                >
                  {getStatusLabel(currentVersion.status)}
                </Badge>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-56 bg-card border-border shadow-lg rounded-lg"
            >
              {versions.map((version) => (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => onVersionSelect?.(version)}
                  className={cn(
                    "flex items-center justify-between p-sm cursor-pointer hover:bg-card-hover transition-smooth",
                    version.id === currentVersion.id && "bg-accent"
                  )}
                >
                  <span className="text-body-sm">v{version.version_number}</span>
                  <Badge
                    variant={getStatusBadgeVariant(version.status)}
                    className="text-metadata"
                  >
                    {getStatusLabel(version.status)}
                  </Badge>
                </DropdownMenuItem>
              ))}
              {versions.length === 0 && (
                <div className="p-sm text-metadata text-muted-foreground text-center">
                  No versions available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-xs">
        {/* New Version */}
        <Button
          variant="outline"
          size="sm"
          className="gap-xs transition-smooth"
          onClick={onNewVersion}
        >
          <Plus className="h-4 w-4" />
          <span className="text-body-sm">New Version</span>
        </Button>

        {/* Compare */}
        {versions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-xs transition-smooth"
            onClick={() => setShowCompareDialog(true)}
          >
            <GitCompare className="h-4 w-4" />
            <span className="text-body-sm">Compare</span>
          </Button>
        )}

        {/* Edit/View Toggle */}
        <Button
          variant={isEditMode ? "default" : "secondary"}
          size="sm"
          className="transition-smooth"
          onClick={onEditModeToggle}
        >
          {isEditMode ? "Save & View" : "Edit"}
        </Button>
      </div>

      {/* Compare Dialog - Stub */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-heading-md font-semibold">
              Compare Versions
            </DialogTitle>
          </DialogHeader>
          <div className="p-lg">
            {/* TODO: Implement side-by-side version comparison */}
            <div className="grid grid-cols-2 gap-md">
              <div className="p-md bg-muted rounded-lg">
                <p className="text-metadata text-muted-foreground text-center">
                  Version comparison coming soon
                </p>
              </div>
              <div className="p-md bg-muted rounded-lg">
                <p className="text-metadata text-muted-foreground text-center">
                  Select two versions to compare
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
