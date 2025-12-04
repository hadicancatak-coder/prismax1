import { Database } from "lucide-react";
import SelectorsManagement from "./SelectorsManagement";

export default function Config() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-section-title">Configuration</h2>
          <p className="text-muted-foreground text-body-sm">Manage entities and cities</p>
        </div>
      </div>

      <SelectorsManagement />
    </div>
  );
}