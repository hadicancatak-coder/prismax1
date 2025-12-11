import SecurityScans from "./SecurityScans";

export default function SecurityPage() {
  return (
    <div className="space-y-lg">
      <div>
        <h2 className="text-heading-md font-semibold">Security Scans</h2>
        <p className="text-muted-foreground mt-xs">Monitor security scans and vulnerabilities</p>
      </div>
      <SecurityScans />
    </div>
  );
}
