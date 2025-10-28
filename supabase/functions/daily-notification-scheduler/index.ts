import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Security: Verify cron secret header
    const cronSecret = req.headers.get('X-Cron-Secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error('Unauthorized daily notification scheduler attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // ========== 1. DEADLINE REMINDERS (3 days) ==========
    const { data: tasks3Days } = await supabase
      .from("tasks")
      .select(`
        id, title, due_at,
        task_assignees!inner(user_id, profiles!inner(user_id))
      `)
      .gte("due_at", threeDaysFromNow.toISOString().split("T")[0])
      .lt("due_at", new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .in("status", ["Pending", "Ongoing"]);

    if (tasks3Days) {
      for (const task of tasks3Days as any[]) {
        for (const assignee of task.task_assignees) {
          await supabase.rpc("send_notification", {
            p_user_id: assignee.profiles?.user_id,
            p_type: "deadline_reminder_3days",
            p_payload_json: {
              task_id: task.id,
              task_title: task.title,
              due_at: task.due_at,
              days_remaining: 3,
            },
          });
        }
      }
    }

    // ========== 2. DEADLINE REMINDERS (1 day) ==========
    const { data: tasks1Day } = await supabase
      .from("tasks")
      .select(`
        id, title, due_at,
        task_assignees!inner(user_id, profiles!inner(user_id))
      `)
      .gte("due_at", oneDayFromNow.toISOString().split("T")[0])
      .lt("due_at", new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .in("status", ["Pending", "Ongoing"]);

    if (tasks1Day) {
      for (const task of tasks1Day as any[]) {
        for (const assignee of task.task_assignees) {
          await supabase.rpc("send_notification", {
            p_user_id: assignee.profiles?.user_id,
            p_type: "deadline_reminder_1day",
            p_payload_json: {
              task_id: task.id,
              task_title: task.title,
              due_at: task.due_at,
              days_remaining: 1,
            },
          });
        }
      }
    }

    // ========== 3. OVERDUE TASK REMINDERS ==========
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select(`
        id, title, due_at,
        task_assignees!inner(user_id, profiles!inner(user_id))
      `)
      .lt("due_at", now.toISOString())
      .in("status", ["Pending", "Ongoing"]);

    if (overdueTasks) {
      for (const task of overdueTasks as any[]) {
        for (const assignee of task.task_assignees) {
          await supabase.rpc("send_notification", {
            p_user_id: assignee.profiles?.user_id,
            p_type: "deadline_reminder_overdue",
            p_payload_json: {
              task_id: task.id,
              task_title: task.title,
              due_at: task.due_at,
              days_overdue: Math.floor((now.getTime() - new Date(task.due_at).getTime()) / (24 * 60 * 60 * 1000)),
            },
          });
        }
      }
    }

    // ========== 4. CAMPAIGN LAUNCH REMINDERS (3 days) ==========
    const { data: upcomingCampaigns } = await supabase
      .from("launch_pad_campaigns")
      .select(`
        id, title, launch_date,
        launch_campaign_assignees!inner(user_id, profiles!inner(user_id))
      `)
      .gte("launch_date", threeDaysFromNow.toISOString().split("T")[0])
      .lt("launch_date", new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .in("status", ["orbit", "ready"]);

    if (upcomingCampaigns) {
      for (const campaign of upcomingCampaigns as any[]) {
        for (const assignee of campaign.launch_campaign_assignees) {
          await supabase.rpc("send_notification", {
            p_user_id: assignee.profiles?.user_id,
            p_type: "campaign_starting_soon",
            p_payload_json: {
              campaign_id: campaign.id,
              campaign_title: campaign.title,
              launch_date: campaign.launch_date,
              days_remaining: 3,
            },
          });
        }
      }
    }

    // ========== 5. PENDING APPROVAL REMINDERS ==========
    const { data: pendingApprovals } = await supabase
      .from("tasks")
      .select(`
        id, title, approval_requested_at,
        task_assignees!inner(user_id, profiles!inner(user_id))
      `)
      .eq("pending_approval", true)
      .not("approval_requested_at", "is", null);

    if (pendingApprovals) {
      for (const task of pendingApprovals as any[]) {
        const daysPending = Math.floor(
          (now.getTime() - new Date(task.approval_requested_at).getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysPending >= 2) {
          for (const assignee of task.task_assignees) {
            await supabase.rpc("send_notification", {
              p_user_id: assignee.profiles?.user_id,
              p_type: "approval_pending",
              p_payload_json: {
                task_id: task.id,
                task_title: task.title,
                days_pending: daysPending,
              },
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent successfully",
        stats: {
          deadline_3days: tasks3Days?.length || 0,
          deadline_1day: tasks1Day?.length || 0,
          overdue: overdueTasks?.length || 0,
          campaigns: upcomingCampaigns?.length || 0,
          approvals: pendingApprovals?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily-notification-scheduler:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
