import { UtmLink } from "@/hooks/useUtmLinks";

export function exportUtmLinksToCSV(links: UtmLink[], filename: string = "utm-links.csv") {
  // Define CSV headers
  const headers = [
    "Campaign",
    "Platform",
    "Source",
    "Medium",
    "Content",
    "Term",
    "Generated URL",
    "Status",
    "Validated",
    "Created At",
  ];

  // Convert links to CSV rows
  const rows = links.map(link => [
    link.campaign_name || "",
    link.platform || "",
    link.utm_source || "",
    link.utm_medium || "",
    link.utm_content || "",
    link.utm_term || "",
    link.base_url || "",
    link.status || "",
    link.is_validated ? "Yes" : "No",
    link.created_at ? new Date(link.created_at).toLocaleDateString() : "",
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => 
      row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
