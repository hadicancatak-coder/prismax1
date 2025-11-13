import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Languages, Target, AlertTriangle } from "lucide-react";
import { LPDetectionResult } from "@/lib/lpDetector";

interface LPDetectionCardProps {
  detection: LPDetectionResult;
}

export function LPDetectionCard({ detection }: LPDetectionCardProps) {
  const getPurposeIcon = () => {
    switch (detection.purpose) {
      case 'AO':
        return '📊';
      case 'Webinar':
        return '🎥';
      case 'Seminar':
        return '🎓';
      default:
        return '❓';
    }
  };

  if (!detection.language && !detection.country && !detection.purpose) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {detection.lpType && (
              <div className="flex items-center gap-2">
                <Badge 
                  variant={detection.lpType === 'static' ? 'default' : 'secondary'}
                  className="text-base font-medium"
                >
                  {detection.lpType === 'static' ? '📄 Static LP' : '⚡ Dynamic LP'}
                </Badge>
              </div>
            )}

            {detection.country && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-base font-medium">
                  {detection.country}
                </Badge>
              </div>
            )}
            
            {detection.language && (
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-base font-medium">
                  {detection.language === 'ar' ? '🇦🇪 AR' : '🇬🇧 EN'}
                </Badge>
              </div>
            )}
            
            {detection.purpose && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="text-base font-medium">
                  {getPurposeIcon()} {detection.purpose}
                </Badge>
              </div>
            )}
            
            <Badge 
              variant={
                detection.confidence === 'high' ? 'default' : 
                detection.confidence === 'medium' ? 'secondary' : 
                'outline'
              }
              className="ml-auto"
            >
              {detection.confidence} confidence
            </Badge>
          </div>
          
          {detection.extractedCity && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                Detected City: <span className="font-semibold text-foreground">{detection.extractedCity}</span>
              </p>
            </div>
          )}
          
          {detection.extractedWebinarName && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                Detected Webinar: <span className="font-semibold text-foreground">{detection.extractedWebinarName}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {detection.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {detection.warnings.map((warning, idx) => (
              <div key={idx}>• {warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
