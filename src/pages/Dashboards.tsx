import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";

export default function Dashboards() {
  return (
    <div className="container mx-auto p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-sm text-gray-900 mb-2">Dashboards</h1>
          <p className="text-body-md text-gray-600">
            Combine visualizations into interactive dashboards
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <LayoutDashboard className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-heading-md text-gray-900 mb-2">No dashboards yet</h3>
            <p className="text-body-md text-gray-600 mb-6">
              Build custom dashboards to track your key metrics
            </p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
