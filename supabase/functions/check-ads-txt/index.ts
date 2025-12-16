import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, itemId } = await req.json();

    if (!url || !itemId) {
      return new Response(
        JSON.stringify({ error: "URL and itemId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ads.txt for URL: ${url}`);

    // Normalize URL
    let normalizedUrl = url.trim().toLowerCase();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Extract domain
    let domain: string;
    try {
      const urlObj = new URL(normalizedUrl);
      domain = urlObj.origin;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adsTxtUrl = `${domain}/ads.txt`;
    console.log(`Fetching: ${adsTxtUrl}`);

    let hasGoogle = false;
    let errorMessage: string | null = null;

    try {
      const response = await fetch(adsTxtUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AdsTxtChecker/1.0)",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          errorMessage = "No ads.txt file found";
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } else {
        const content = await response.text();
        // Check for google.com entries (case-insensitive)
        hasGoogle = content.toLowerCase().includes("google.com");
        console.log(`ads.txt content length: ${content.length}, hasGoogle: ${hasGoogle}`);
      }
    } catch (fetchError: unknown) {
      console.error("Fetch error:", fetchError);
      const errMsg = fetchError instanceof Error ? fetchError.message : "Unknown error";
      errorMessage = `Failed to fetch: ${errMsg}`;
    }

    // Update the database record
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("gdn_target_items")
      .update({
        ads_txt_has_google: errorMessage ? null : hasGoogle,
        ads_txt_checked_at: new Date().toISOString(),
        ads_txt_error: errorMessage,
      })
      .eq("id", itemId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasGoogle,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-ads-txt:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
