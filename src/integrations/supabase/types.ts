export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          budget_monthly: number | null
          created_at: string | null
          created_by: string | null
          entity: string | null
          google_campaign_id: string | null
          google_campaign_url: string | null
          id: string
          name: string
          objective: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget_monthly?: number | null
          created_at?: string | null
          created_by?: string | null
          entity?: string | null
          google_campaign_id?: string | null
          google_campaign_url?: string | null
          id?: string
          name: string
          objective?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_monthly?: number | null
          created_at?: string | null
          created_by?: string | null
          entity?: string | null
          google_campaign_id?: string | null
          google_campaign_url?: string | null
          id?: string
          name?: string
          objective?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_comments: {
        Row: {
          ad_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          ad_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          ad_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_comments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_groups: {
        Row: {
          campaign_id: string
          created_at: string | null
          created_by: string | null
          id: string
          keywords: Json | null
          match_types: Json | null
          max_cpc: number | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          keywords?: Json | null
          match_types?: Json | null
          max_cpc?: number | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          keywords?: Json | null
          match_types?: Json | null
          max_cpc?: number | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_groups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_performance_snapshots: {
        Row: {
          ad_id: string
          clicks: number | null
          conversions: number | null
          cost: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          id: string
          impressions: number | null
          snapshot_date: string | null
        }
        Insert: {
          ad_id: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          id?: string
          impressions?: number | null
          snapshot_date?: string | null
        }
        Update: {
          ad_id?: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          id?: string
          impressions?: number | null
          snapshot_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_performance_snapshots_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_templates: {
        Row: {
          callouts: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          descriptions: Json | null
          entity: string | null
          headlines: Json | null
          id: string
          is_public: boolean | null
          landing_page: string | null
          name: string
          sitelinks: Json | null
          updated_at: string | null
        }
        Insert: {
          callouts?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          descriptions?: Json | null
          entity?: string | null
          headlines?: Json | null
          id?: string
          is_public?: boolean | null
          landing_page?: string | null
          name: string
          sitelinks?: Json | null
          updated_at?: string | null
        }
        Update: {
          callouts?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          descriptions?: Json | null
          entity?: string | null
          headlines?: Json | null
          id?: string
          is_public?: boolean | null
          landing_page?: string | null
          name?: string
          sitelinks?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_group_id: string | null
          ad_strength: number | null
          approval_status: string | null
          callouts: Json
          compliance_issues: Json | null
          created_at: string
          created_by: string
          date_launched: string | null
          date_paused: string | null
          descriptions: Json
          entity: string | null
          google_ad_id: string | null
          headlines: Json
          id: string
          landing_page: string | null
          name: string
          sitelinks: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ad_group_id?: string | null
          ad_strength?: number | null
          approval_status?: string | null
          callouts?: Json
          compliance_issues?: Json | null
          created_at?: string
          created_by: string
          date_launched?: string | null
          date_paused?: string | null
          descriptions?: Json
          entity?: string | null
          google_ad_id?: string | null
          headlines?: Json
          id?: string
          landing_page?: string | null
          name: string
          sitelinks?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ad_group_id?: string | null
          ad_strength?: number | null
          approval_status?: string | null
          callouts?: Json
          compliance_issues?: Json | null
          created_at?: string
          created_by?: string
          date_launched?: string | null
          date_paused?: string | null
          descriptions?: Json
          entity?: string | null
          google_ad_id?: string | null
          headlines?: Json
          id?: string
          landing_page?: string | null
          name?: string
          sitelinks?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_ad_group_id_fkey"
            columns: ["ad_group_id"]
            isOneToOne: false
            referencedRelation: "ad_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          priority: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: string | null
          title?: string
        }
        Relationships: []
      }
      blocker_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          blocker_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          blocker_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          blocker_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocker_assignees_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "blockers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocker_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blockers: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          fix_process: string | null
          id: string
          resolved: boolean | null
          stuck_reason: string | null
          task_id: string
          timeline: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          fix_process?: string | null
          id?: string
          resolved?: boolean | null
          stuck_reason?: string | null
          task_id: string
          timeline?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          fix_process?: string | null
          id?: string
          resolved?: boolean | null
          stuck_reason?: string | null
          task_id?: string
          timeline?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          campaign_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          campaign_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          campaign_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assignees_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          entity: string[] | null
          id: string
          image_url: string | null
          lp_link: string | null
          start_date: string
          target: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          entity?: string[] | null
          id?: string
          image_url?: string | null
          lp_link?: string | null
          start_date: string
          target: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          entity?: string[] | null
          id?: string
          image_url?: string | null
          lp_link?: string | null
          start_date?: string
          target?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          mentioned_user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          mentioned_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_campaign_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          campaign_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          campaign_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          campaign_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_campaign_assignees_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_campaigns_with_assignees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_campaign_assignees_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_pad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_campaign_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_pad_campaigns: {
        Row: {
          captions: string | null
          converted_to_task: boolean | null
          created_at: string
          created_by: string
          creatives_link: string | null
          description: string | null
          entity: string[] | null
          id: string
          jira_links: Json | null
          launch_date: string | null
          launch_month: string | null
          launched_at: string | null
          lp_url: string | null
          status: string | null
          task_id: string | null
          teams: string[]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          captions?: string | null
          converted_to_task?: boolean | null
          created_at?: string
          created_by: string
          creatives_link?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          jira_links?: Json | null
          launch_date?: string | null
          launch_month?: string | null
          launched_at?: string | null
          lp_url?: string | null
          status?: string | null
          task_id?: string | null
          teams?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          captions?: string | null
          converted_to_task?: boolean | null
          created_at?: string
          created_by?: string
          creatives_link?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          jira_links?: Json | null
          launch_date?: string | null
          launch_month?: string | null
          launched_at?: string | null
          lp_url?: string | null
          status?: string | null
          task_id?: string | null
          teams?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_pad_campaigns_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rate_limit: {
        Row: {
          created_at: string
          id: string
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload_json: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload_json: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload_json?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone_number: string | null
          tagline: string | null
          teams: Database["public"]["Enums"]["team"][] | null
          title: string | null
          user_id: string
          username: string | null
          working_days: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone_number?: string | null
          tagline?: string | null
          teams?: Database["public"]["Enums"]["team"][] | null
          title?: string | null
          user_id: string
          username?: string | null
          working_days?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone_number?: string | null
          tagline?: string | null
          teams?: Database["public"]["Enums"]["team"][] | null
          title?: string | null
          user_id?: string
          username?: string | null
          working_days?: string | null
        }
        Relationships: []
      }
      project_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_timelines: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          phase_name: string
          project_id: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          phase_name: string
          project_id?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          phase_name?: string
          project_id?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_timelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          members: string[] | null
          name: string
          required_time: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          members?: string[] | null
          name: string
          required_time?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          members?: string[] | null
          name?: string
          required_time?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link: string
          title: string
          type: string
          update_frequency: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link: string
          title: string
          type: string
          update_frequency?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string
          title?: string
          type?: string
          update_frequency?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_change_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          payload_json: Json
          requester_id: string
          status: string
          task_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload_json: Json
          requester_id: string
          status?: string
          task_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          payload_json?: Json
          requester_id?: string
          status?: string
          task_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_change_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string | null
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          checklist_items: Json | null
          created_at: string
          created_by: string | null
          default_assignee_id: string | null
          default_priority: Database["public"]["Enums"]["task_priority"] | null
          description: string | null
          entity: string | null
          estimated_hours: number | null
          id: string
          is_public: boolean | null
          labels: string[] | null
          name: string
        }
        Insert: {
          checklist_items?: Json | null
          created_at?: string
          created_by?: string | null
          default_assignee_id?: string | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          description?: string | null
          entity?: string | null
          estimated_hours?: number | null
          id?: string
          is_public?: boolean | null
          labels?: string[] | null
          name: string
        }
        Update: {
          checklist_items?: Json | null
          created_at?: string
          created_by?: string | null
          default_assignee_id?: string | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          description?: string | null
          entity?: string | null
          estimated_hours?: number | null
          id?: string
          is_public?: boolean | null
          labels?: string[] | null
          name?: string
        }
        Relationships: []
      }
      task_watchers: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_watchers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          approval_requested_at: string | null
          approval_requested_by: string | null
          assignee_id: string | null
          blocker_id: string | null
          blocker_reason: string | null
          campaign_id: string | null
          checklist: Json | null
          created_at: string
          created_by: string | null
          delete_requested_at: string | null
          delete_requested_by: string | null
          description: string | null
          due_at: string | null
          entity: string[] | null
          estimated_hours: number | null
          failure_reason: string | null
          id: string
          jira_key: string | null
          jira_link: string | null
          jira_links: Json | null
          labels: string[] | null
          order_index: number | null
          pending_approval: boolean | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          project_key: string | null
          recurrence_day_of_month: number | null
          recurrence_day_of_week: number | null
          recurrence_rrule: string | null
          requested_status: Database["public"]["Enums"]["task_status"] | null
          source: Database["public"]["Enums"]["task_source"]
          sprint: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"] | null
          title: string
          updated_at: string
          updated_by: string | null
          visibility: Database["public"]["Enums"]["task_visibility"]
        }
        Insert: {
          actual_hours?: number | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          assignee_id?: string | null
          blocker_id?: string | null
          blocker_reason?: string | null
          campaign_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          delete_requested_at?: string | null
          delete_requested_by?: string | null
          description?: string | null
          due_at?: string | null
          entity?: string[] | null
          estimated_hours?: number | null
          failure_reason?: string | null
          id?: string
          jira_key?: string | null
          jira_link?: string | null
          jira_links?: Json | null
          labels?: string[] | null
          order_index?: number | null
          pending_approval?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          project_key?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_rrule?: string | null
          requested_status?: Database["public"]["Enums"]["task_status"] | null
          source?: Database["public"]["Enums"]["task_source"]
          sprint?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Update: {
          actual_hours?: number | null
          approval_requested_at?: string | null
          approval_requested_by?: string | null
          assignee_id?: string | null
          blocker_id?: string | null
          blocker_reason?: string | null
          campaign_id?: string | null
          checklist?: Json | null
          created_at?: string
          created_by?: string | null
          delete_requested_at?: string | null
          delete_requested_by?: string | null
          description?: string | null
          due_at?: string | null
          entity?: string[] | null
          estimated_hours?: number | null
          failure_reason?: string | null
          id?: string
          jira_key?: string | null
          jira_link?: string | null
          jira_links?: Json | null
          labels?: string[] | null
          order_index?: number | null
          pending_approval?: boolean | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          project_key?: string | null
          recurrence_day_of_month?: number | null
          recurrence_day_of_week?: number | null
          recurrence_rrule?: string | null
          requested_status?: Database["public"]["Enums"]["task_status"] | null
          source?: Database["public"]["Enums"]["task_source"]
          sprint?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_approval_requested_by_fkey"
            columns: ["approval_requested_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "blockers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_campaigns_with_assignees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "launch_pad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          seconds: number | null
          started_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          seconds?: number | null
          started_at: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          seconds?: number | null
          started_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      launch_campaigns_with_assignees: {
        Row: {
          assignees: Json | null
          captions: string | null
          created_at: string | null
          created_by: string | null
          creatives_link: string | null
          id: string | null
          launch_month: string | null
          launched_at: string | null
          lp_url: string | null
          status: string | null
          teams: string[] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          name: string | null
          tagline: string | null
          teams: Database["public"]["Enums"]["team"][] | null
          title: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          name?: string | null
          tagline?: string | null
          teams?: Database["public"]["Enums"]["team"][] | null
          title?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          name?: string | null
          tagline?: string | null
          teams?: Database["public"]["Enums"]["team"][] | null
          title?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_actual_hours: {
        Args: { task_uuid: string }
        Returns: number
      }
      cleanup_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_all_users_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          email: string
          name: string
          phone_number: string
          title: string
          user_id: string
          username: string
          working_days: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_comment_author: {
        Args: { _comment_id: string; _user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_field_name?: string
          p_metadata?: Json
          p_new_value?: string
          p_old_value?: string
          p_user_id: string
        }
        Returns: string
      }
      reschedule_overdue_tasks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
      task_priority: "High" | "Medium" | "Low"
      task_source: "native" | "jira"
      task_status: "Pending" | "Ongoing" | "Failed" | "Blocked" | "Completed"
      task_type: "task" | "campaign_launch"
      task_visibility: "global" | "pool" | "private"
      team: "SocialUA" | "PPC" | "PerMar"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
      task_priority: ["High", "Medium", "Low"],
      task_source: ["native", "jira"],
      task_status: ["Pending", "Ongoing", "Failed", "Blocked", "Completed"],
      task_type: ["task", "campaign_launch"],
      task_visibility: ["global", "pool", "private"],
      team: ["SocialUA", "PPC", "PerMar"],
    },
  },
} as const
