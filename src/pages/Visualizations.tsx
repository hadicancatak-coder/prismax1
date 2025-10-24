import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus } from "lucide-react";

export default function Visualizations() {
  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm text-gray-900 mb-2">Visualizations</h1>
          <p className="text-body-md text-gray-600">
            Create and manage charts, graphs, and pivot tables
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Visualization
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-heading-md text-gray-900 mb-2">No visualizations yet</h3>
            <p className="text-body-md text-gray-600 mb-6">
              Create your first chart or pivot table from your datasets
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Visualization
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
