import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Sparkles, Mail } from "lucide-react";

export default function About() {
  const currentVersion = "1.2.1";

  const versionHistory = [
    {
      version: "1.2.1",
      date: "October 25",
      features: [
        "Drag & drop campaign status management in Launch Pad",
        "Automated workflows on status changes (notifications, task completion)",
        "Fixed scrolling in Launch Pad boxes",
        "CFI logo integration in sidebar",
        "Restructured navigation (Operations menu)",
        "Admin links moved to user menu",
      ],
    },
    {
      version: "1.2.0",
      date: "October 25",
      features: [
        "Enhanced password security (9+ characters, uppercase, number, special)",
        "User profile menu with quick access",
        "Security settings page",
        "MFA session persistence (2-hour duration)",
        "Real-time password strength validation",
        "Backup codes management",
      ],
    },
    {
      version: "1.1.0",
      date: "October 25",
      features: [
        "Two-factor authentication (MFA)",
        "Campaign management system",
        "Task dependencies",
        "Activity tracking",
        "Launch pad for campaigns",
      ],
    },
    {
      version: "1.0.0",
      date: "October 25",
      features: [
        "Initial release",
        "Task management",
        "User authentication",
        "Team collaboration",
        "Notifications system",
      ],
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* App Information */}
      <Card className="p-8">
        <div className="flex items-start gap-6">
          <div className="bg-primary/10 p-4 rounded-lg">
            <Info className="h-12 w-12 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">Prisma</h1>
            <Badge variant="secondary" className="mb-4">
              Version {currentVersion}
            </Badge>
            <p className="text-lg text-muted-foreground mb-4">Comprehensive Task & Campaign Management Platform</p>
            <p className="text-sm text-muted-foreground">
              Prisma is a powerful platform designed to streamline task management, campaign coordination, and team
              collaboration. Built with security and efficiency in mind, it helps teams stay organized and productive.
              Created by and for the CFI Global Performance Marketing Team.
            </p>
          </div>
        </div>
      </Card>

      {/* What's New / Version History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">What's New</h2>
        </div>

        <div className="space-y-6">
          {versionHistory.map((version, index) => (
            <div key={version.version} className="border-l-2 border-primary/20 pl-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">Version {version.version}</h3>
                {index === 0 && <Badge variant="default">Current</Badge>}
                <span className="text-sm text-muted-foreground">{version.date}</span>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                {version.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-sm text-muted-foreground">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Support & Contact */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Support & Contact</h2>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Support Email</p>
            <a href="mailto:h.catak@cfi.trade" className="text-sm text-primary hover:underline">
              h.catak@cfi.trade
            </a>
          </div>

          <div>
            <p className="text-sm font-medium">Organization</p>
            <p className="text-sm text-muted-foreground">PerMar at CFI Financial Group</p>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>© 2025 Prisma. All rights reserved.</p>
      </div>
    </div>
  );
}
