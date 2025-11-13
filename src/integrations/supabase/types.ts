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
          is_template: boolean | null
          languages: string[] | null
          name: string
          objective: string | null
          status: string | null
          template_name: string | null
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
          is_template?: boolean | null
          languages?: string[] | null
          name: string
          objective?: string | null
          status?: string | null
          template_name?: string | null
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
          is_template?: boolean | null
          languages?: string[] | null
          name?: string
          objective?: string | null
          status?: string | null
          template_name?: string | null
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
      ad_elements: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string
          element_type: string
          entity: string[] | null
          google_status: string | null
          google_status_date: string | null
          google_status_notes: string | null
          id: string
          is_favorite: boolean | null
          language: string | null
          last_used_at: string | null
          platform: string | null
          tags: string[] | null
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          created_by: string
          element_type: string
          entity?: string[] | null
          google_status?: string | null
          google_status_date?: string | null
          google_status_notes?: string | null
          id?: string
          is_favorite?: boolean | null
          language?: string | null
          last_used_at?: string | null
          platform?: string | null
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string
          element_type?: string
          entity?: string[] | null
          google_status?: string | null
          google_status_date?: string | null
          google_status_notes?: string | null
          id?: string
          is_favorite?: boolean | null
          language?: string | null
          last_used_at?: string | null
          platform?: string | null
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      ad_group_versions: {
        Row: {
          ad_group_id: string | null
          changed_fields: string[] | null
          created_at: string | null
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          ad_group_id?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
        }
        Update: {
          ad_group_id?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_group_versions_ad_group_id_fkey"
            columns: ["ad_group_id"]
            isOneToOne: false
            referencedRelation: "ad_groups"
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
          is_template: boolean | null
          keywords: Json | null
          match_types: Json | null
          max_cpc: number | null
          name: string
          status: string | null
          template_name: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          keywords?: Json | null
          match_types?: Json | null
          max_cpc?: number | null
          name: string
          status?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_template?: boolean | null
          keywords?: Json | null
          match_types?: Json | null
          max_cpc?: number | null
          name?: string
          status?: string | null
          template_name?: string | null
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
      ad_move_history: {
        Row: {
          action_type: string
          ad_id: string | null
          from_ad_group_id: string | null
          id: string
          moved_at: string | null
          moved_by: string | null
          to_ad_group_id: string | null
        }
        Insert: {
          action_type: string
          ad_id?: string | null
          from_ad_group_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          to_ad_group_id?: string | null
        }
        Update: {
          action_type?: string
          ad_id?: string | null
          from_ad_group_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          to_ad_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_move_history_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
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
          ad_type: string | null
          business_name: string | null
          callouts: Json | null
          created_at: string | null
          created_by: string | null
          cta_text: string | null
          description: string | null
          descriptions: Json | null
          entity: string | null
          headlines: Json | null
          id: string
          is_public: boolean | null
          landing_page: string | null
          long_headline: string | null
          name: string
          sitelinks: Json | null
          updated_at: string | null
        }
        Insert: {
          ad_type?: string | null
          business_name?: string | null
          callouts?: Json | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          description?: string | null
          descriptions?: Json | null
          entity?: string | null
          headlines?: Json | null
          id?: string
          is_public?: boolean | null
          landing_page?: string | null
          long_headline?: string | null
          name: string
          sitelinks?: Json | null
          updated_at?: string | null
        }
        Update: {
          ad_type?: string | null
          business_name?: string | null
          callouts?: Json | null
          created_at?: string | null
          created_by?: string | null
          cta_text?: string | null
          description?: string | null
          descriptions?: Json | null
          entity?: string | null
          headlines?: Json | null
          id?: string
          is_public?: boolean | null
          landing_page?: string | null
          long_headline?: string | null
          name?: string
          sitelinks?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_versions: {
        Row: {
          ad_id: string
          changed_fields: string[] | null
          created_at: string | null
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          ad_id: string
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
        }
        Update: {
          ad_id?: string
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_versions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_group_id: string | null
          ad_group_name: string | null
          ad_strength: number | null
          ad_type: string | null
          approval_status: string | null
          business_name: string | null
          callouts: Json
          campaign_name: string | null
          compliance_issues: Json | null
          created_at: string
          created_by: string
          cta_text: string | null
          date_launched: string | null
          date_paused: string | null
          descriptions: Json
          entity: string | null
          google_ad_id: string | null
          headlines: Json
          id: string
          landing_page: string | null
          language: string | null
          long_headline: string | null
          name: string
          short_headlines: Json | null
          sitelinks: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          ad_strength?: number | null
          ad_type?: string | null
          approval_status?: string | null
          business_name?: string | null
          callouts?: Json
          campaign_name?: string | null
          compliance_issues?: Json | null
          created_at?: string
          created_by: string
          cta_text?: string | null
          date_launched?: string | null
          date_paused?: string | null
          descriptions?: Json
          entity?: string | null
          google_ad_id?: string | null
          headlines?: Json
          id?: string
          landing_page?: string | null
          language?: string | null
          long_headline?: string | null
          name: string
          short_headlines?: Json | null
          sitelinks?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ad_group_id?: string | null
          ad_group_name?: string | null
          ad_strength?: number | null
          ad_type?: string | null
          approval_status?: string | null
          business_name?: string | null
          callouts?: Json
          campaign_name?: string | null
          compliance_issues?: Json | null
          created_at?: string
          created_by?: string
          cta_text?: string | null
          date_launched?: string | null
          date_paused?: string | null
          descriptions?: Json
          entity?: string | null
          google_ad_id?: string | null
          headlines?: Json
          id?: string
          landing_page?: string | null
          language?: string | null
          long_headline?: string | null
          name?: string
          short_headlines?: Json | null
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
      approval_history: {
        Row: {
          ad_id: string
          approver_id: string | null
          comment: string | null
          created_at: string
          id: string
          stage: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          stage: string
          status: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          stage?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
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
            foreignKeyName: "blocker_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      campaign_placements: {
        Row: {
          allocated_budget: number
          campaign_id: string | null
          created_at: string | null
          id: string
          location_id: string | null
          notes: string | null
        }
        Insert: {
          allocated_budget: number
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
        }
        Update: {
          allocated_budget?: number
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_placements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "planned_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_placements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "media_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_versions: {
        Row: {
          campaign_id: string | null
          changed_fields: string[] | null
          created_at: string | null
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          campaign_id?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
        }
        Update: {
          campaign_id?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_versions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
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
      copywriter_copies: {
        Row: {
          campaigns: string[] | null
          char_limit_ar: number | null
          char_limit_az: number | null
          char_limit_en: number | null
          char_limit_es: number | null
          content_ar: string | null
          content_az: string | null
          content_en: string | null
          content_es: string | null
          created_at: string
          created_by: string
          element_type: string
          entity: string[]
          id: string
          is_synced_to_planner: boolean | null
          platform: string[]
          region: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          campaigns?: string[] | null
          char_limit_ar?: number | null
          char_limit_az?: number | null
          char_limit_en?: number | null
          char_limit_es?: number | null
          content_ar?: string | null
          content_az?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          created_by: string
          element_type: string
          entity?: string[]
          id?: string
          is_synced_to_planner?: boolean | null
          platform?: string[]
          region?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          campaigns?: string[] | null
          char_limit_ar?: number | null
          char_limit_az?: number | null
          char_limit_en?: number | null
          char_limit_es?: number | null
          content_ar?: string | null
          content_az?: string | null
          content_en?: string | null
          content_es?: string | null
          created_at?: string
          created_by?: string
          element_type?: string
          entity?: string[]
          id?: string
          is_synced_to_planner?: boolean | null
          platform?: string[]
          region?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      entity_campaigns: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          entity: string
          id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          entity: string
          id?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          entity?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_campaigns_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_change_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          entity_id: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          entity_id?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      entity_presets: {
        Row: {
          created_at: string | null
          entities: string[]
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entities: string[]
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entities?: string[]
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kpi_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          kpi_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          kpi_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          kpi_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_assignments_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string
          current_value: number
          id: string
          kpi_id: string
          target_name: string
          target_type: string
          target_value: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          kpi_id: string
          target_name: string
          target_type: string
          target_value: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          kpi_id?: string
          target_name?: string
          target_type?: string
          target_value?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          metric_type: string
          target: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          metric_type: string
          target: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          metric_type?: string
          target?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_templates: {
        Row: {
          base_url: string
          country: string | null
          created_at: string | null
          created_by: string
          id: string
          language: string | null
          lp_type: string | null
          platform: string | null
          purpose: string | null
          updated_at: string | null
        }
        Insert: {
          base_url: string
          country?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          language?: string | null
          lp_type?: string | null
          platform?: string | null
          purpose?: string | null
          updated_at?: string | null
        }
        Update: {
          base_url?: string
          country?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          language?: string | null
          lp_type?: string | null
          platform?: string | null
          purpose?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "launch_campaign_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      location_historic_prices: {
        Row: {
          created_at: string
          id: string
          location_id: string
          price: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          price: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          price?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_historic_prices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "media_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_past_campaigns: {
        Row: {
          budget: number
          campaign_date: string
          campaign_name: string
          created_at: string
          id: string
          location_id: string
          notes: string | null
        }
        Insert: {
          budget: number
          campaign_date: string
          campaign_name: string
          created_at?: string
          id?: string
          location_id: string
          notes?: string | null
        }
        Update: {
          budget?: number
          campaign_date?: string
          campaign_name?: string
          created_at?: string
          id?: string
          location_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_past_campaigns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "media_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_locations: {
        Row: {
          agency: string | null
          city: string
          created_at: string
          created_by: string | null
          est_daily_traffic: number | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          manual_score: number | null
          name: string
          notes: string | null
          price_per_month: number | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          agency?: string | null
          city: string
          created_at?: string
          created_by?: string | null
          est_daily_traffic?: number | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          manual_score?: number | null
          name: string
          notes?: string | null
          price_per_month?: number | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          agency?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          est_daily_traffic?: number | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          manual_score?: number | null
          name?: string
          notes?: string | null
          price_per_month?: number | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: []
      }
      mfa_backup_code_usage: {
        Row: {
          code_hash: string
          id: string
          ip_address: string | null
          used_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          id?: string
          ip_address?: string | null
          used_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          id?: string
          ip_address?: string | null
          used_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mfa_challenges: {
        Row: {
          action_context: string | null
          challenge_type: string
          expires_at: string
          id: string
          user_id: string
          verified_at: string
        }
        Insert: {
          action_context?: string | null
          challenge_type: string
          expires_at?: string
          id?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          action_context?: string | null
          challenge_type?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      mfa_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          skip_validation_for_ip: boolean | null
          user_agent: string | null
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token: string
          skip_validation_for_ip?: boolean | null
          user_agent?: string | null
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          skip_validation_for_ip?: boolean | null
          user_agent?: string | null
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      mfa_verification_attempts: {
        Row: {
          attempt_time: string
          id: string
          ip_address: string | null
          success: boolean
          user_id: string
        }
        Insert: {
          attempt_time?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_id: string
        }
        Update: {
          attempt_time?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          notification_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          notification_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      operation_audit_item_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          item_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          item_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_audit_item_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "operation_audit_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_audit_item_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "operation_audit_item_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_audit_items: {
        Row: {
          assigned_to: string | null
          audit_log_id: string | null
          completed_at: string | null
          completed_by: string | null
          content: string
          created_at: string | null
          id: string
          order_index: number | null
          status: string | null
          task_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          audit_log_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          content: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          status?: string | null
          task_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          audit_log_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          status?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_audit_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_audit_items_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: false
            referencedRelation: "operation_audit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_audit_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_audit_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_audit_logs: {
        Row: {
          auto_assigned: boolean | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          entity: string[] | null
          id: string
          platform: string
          status: string | null
          task_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_assigned?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          platform: string
          status?: string | null
          task_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_assigned?: boolean | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          platform?: string
          status?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_audit_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      planned_campaigns: {
        Row: {
          agency: string | null
          budget: number
          cities: string[]
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          name: string
          notes: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agency?: string | null
          budget: number
          cities: string[]
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agency?: string | null
          budget?: number
          cities?: string[]
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_team_mapping: {
        Row: {
          created_at: string | null
          default_assignees: string[] | null
          id: string
          platform: string
          team_name: string
        }
        Insert: {
          created_at?: string | null
          default_assignees?: string[] | null
          id?: string
          platform: string
          team_name: string
        }
        Update: {
          created_at?: string | null
          default_assignees?: string[] | null
          id?: string
          platform?: string
          team_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          force_password_reset: boolean | null
          id: string
          kpis: string | null
          last_mfa_prompt_at: string | null
          last_password_change: string | null
          mfa_backup_codes_generated_at: string | null
          mfa_enabled: boolean | null
          mfa_enrolled: boolean | null
          mfa_enrollment_required: boolean | null
          mfa_temp_bypass_until: string | null
          name: string
          password_last_changed_at: string | null
          phone_number: string | null
          quarterly_kpis: Json | null
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
          force_password_reset?: boolean | null
          id?: string
          kpis?: string | null
          last_mfa_prompt_at?: string | null
          last_password_change?: string | null
          mfa_backup_codes_generated_at?: string | null
          mfa_enabled?: boolean | null
          mfa_enrolled?: boolean | null
          mfa_enrollment_required?: boolean | null
          mfa_temp_bypass_until?: string | null
          name: string
          password_last_changed_at?: string | null
          phone_number?: string | null
          quarterly_kpis?: Json | null
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
          force_password_reset?: boolean | null
          id?: string
          kpis?: string | null
          last_mfa_prompt_at?: string | null
          last_password_change?: string | null
          mfa_backup_codes_generated_at?: string | null
          mfa_enabled?: boolean | null
          mfa_enrolled?: boolean | null
          mfa_enrollment_required?: boolean | null
          mfa_temp_bypass_until?: string | null
          name?: string
          password_last_changed_at?: string | null
          phone_number?: string | null
          quarterly_kpis?: Json | null
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
      recurring_task_completions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          completed_date: string
          id: string
          task_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          completed_date: string
          id?: string
          task_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          completed_date?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
      saved_ads_library: {
        Row: {
          ad_group: string | null
          ad_group_id: string | null
          ad_type: string
          campaign: string | null
          campaign_id: string | null
          compliance_score: number | null
          content: Json
          created_at: string | null
          entity: string
          google_approval_status: string | null
          id: string
          is_template: boolean | null
          name: string
          quality_score: number | null
          tags: string[] | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          ad_group?: string | null
          ad_group_id?: string | null
          ad_type?: string
          campaign?: string | null
          campaign_id?: string | null
          compliance_score?: number | null
          content: Json
          created_at?: string | null
          entity: string
          google_approval_status?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          quality_score?: number | null
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          ad_group?: string | null
          ad_group_id?: string | null
          ad_type?: string
          campaign?: string | null
          campaign_id?: string | null
          compliance_score?: number | null
          content?: Json
          created_at?: string | null
          entity?: string
          google_approval_status?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          quality_score?: number | null
          tags?: string[] | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_ads_library_ad_group_id_fkey"
            columns: ["ad_group_id"]
            isOneToOne: false
            referencedRelation: "ad_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_ads_library_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scan_results: {
        Row: {
          completed_at: string | null
          created_at: string
          findings: Json | null
          id: string
          scan_status: string
          scan_type: string
          started_at: string
          summary: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          scan_status?: string
          scan_type: string
          started_at?: string
          summary?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          scan_status?: string
          scan_type?: string
          started_at?: string
          summary?: Json | null
        }
        Relationships: []
      }
      seminar_cities: {
        Row: {
          country: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      status_logs: {
        Row: {
          campaign_name: string | null
          converted_at: string | null
          converted_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity: string[] | null
          id: string
          log_type: string
          platform: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_name?: string | null
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          log_type: string
          platform?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string | null
          converted_at?: string | null
          converted_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity?: string[] | null
          id?: string
          log_type?: string
          platform?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicious_activities: {
        Row: {
          activity_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_entities: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          emoji: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
          website_param: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
          website_param?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
          website_param?: string | null
        }
        Relationships: []
      }
      task_activity_log: {
        Row: {
          action_type: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "task_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      task_change_logs: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string
          created_at: string
          description: string | null
          field_name: string
          id: string
          new_value: Json | null
          old_value: Json | null
          task_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by: string
          created_at?: string
          description?: string | null
          field_name: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          task_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string
          created_at?: string
          description?: string | null
          field_name?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_change_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
          change_requested_fields: string[] | null
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
          pending_changes: Json | null
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
          teams: Json | null
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
          change_requested_fields?: string[] | null
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
          pending_changes?: Json | null
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
          teams?: Json | null
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
          change_requested_fields?: string[] | null
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
          pending_changes?: Json | null
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
          teams?: Json | null
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
      user_mfa_secrets: {
        Row: {
          created_at: string | null
          mfa_backup_codes: string[] | null
          mfa_enrolled_at: string | null
          mfa_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          mfa_backup_codes?: string[] | null
          mfa_enrolled_at?: string | null
          mfa_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          mfa_backup_codes?: string[] | null
          mfa_enrolled_at?: string | null
          mfa_secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_task_order: {
        Row: {
          created_at: string | null
          date_scope: string
          id: string
          order_index: number
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_scope: string
          id?: string
          order_index: number
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_scope?: string
          id?: string
          order_index?: number
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_order_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      utm_campaigns: {
        Row: {
          campaign_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          landing_page: string | null
          last_used_at: string | null
          name: string
          usage_count: number | null
        }
        Insert: {
          campaign_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          landing_page?: string | null
          last_used_at?: string | null
          name: string
          usage_count?: number | null
        }
        Update: {
          campaign_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          landing_page?: string | null
          last_used_at?: string | null
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      utm_change_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          utm_link_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          utm_link_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          utm_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utm_change_history_utm_link_id_fkey"
            columns: ["utm_link_id"]
            isOneToOne: false
            referencedRelation: "utm_links"
            referencedColumns: ["id"]
          },
        ]
      }
      utm_links: {
        Row: {
          base_url: string
          campaign_name: string | null
          campaign_type: Database["public"]["Enums"]["campaign_type"] | null
          click_count: number | null
          created_at: string
          created_by: string
          custom_params: Json | null
          dynamic_language: string | null
          entity: string[] | null
          expansion_group_id: string | null
          full_url: string
          id: string
          is_template: boolean | null
          is_validated: boolean | null
          last_used_at: string | null
          link_purpose: string | null
          lp_type: string | null
          month_year: string | null
          name: string
          notes: string | null
          platform: string | null
          status: Database["public"]["Enums"]["utm_status"] | null
          tags: string[] | null
          teams: string[] | null
          updated_at: string
          updated_by: string | null
          usage_context: string | null
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          base_url: string
          campaign_name?: string | null
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          click_count?: number | null
          created_at?: string
          created_by: string
          custom_params?: Json | null
          dynamic_language?: string | null
          entity?: string[] | null
          expansion_group_id?: string | null
          full_url: string
          id?: string
          is_template?: boolean | null
          is_validated?: boolean | null
          last_used_at?: string | null
          link_purpose?: string | null
          lp_type?: string | null
          month_year?: string | null
          name: string
          notes?: string | null
          platform?: string | null
          status?: Database["public"]["Enums"]["utm_status"] | null
          tags?: string[] | null
          teams?: string[] | null
          updated_at?: string
          updated_by?: string | null
          usage_context?: string | null
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          base_url?: string
          campaign_name?: string | null
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          click_count?: number | null
          created_at?: string
          created_by?: string
          custom_params?: Json | null
          dynamic_language?: string | null
          entity?: string[] | null
          expansion_group_id?: string | null
          full_url?: string
          id?: string
          is_template?: boolean | null
          is_validated?: boolean | null
          last_used_at?: string | null
          link_purpose?: string | null
          lp_type?: string | null
          month_year?: string | null
          name?: string
          notes?: string | null
          platform?: string | null
          status?: Database["public"]["Enums"]["utm_status"] | null
          tags?: string[] | null
          teams?: string[] | null
          updated_at?: string
          updated_by?: string | null
          usage_context?: string | null
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      utm_mediums: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      utm_platforms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          utm_medium: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          utm_medium?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          utm_medium?: string | null
        }
        Relationships: []
      }
      utm_templates: {
        Row: {
          campaign_type: Database["public"]["Enums"]["campaign_type"] | null
          created_at: string
          created_by: string
          description: string | null
          entity: string | null
          id: string
          is_public: boolean | null
          name: string
          team: string | null
          updated_at: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          created_at?: string
          created_by: string
          description?: string | null
          entity?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          team?: string | null
          updated_at?: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          campaign_type?: Database["public"]["Enums"]["campaign_type"] | null
          created_at?: string
          created_by?: string
          description?: string | null
          entity?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          team?: string | null
          updated_at?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: []
      }
      web_intel_historic_prices: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          price: number
          site_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          price: number
          site_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          price?: number
          site_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "web_intel_historic_prices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "web_intel_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      web_intel_past_campaigns: {
        Row: {
          budget: number
          campaign_date: string
          campaign_name: string
          created_at: string
          ctr: number | null
          id: string
          notes: string | null
          site_id: string
        }
        Insert: {
          budget: number
          campaign_date: string
          campaign_name: string
          created_at?: string
          ctr?: number | null
          id?: string
          notes?: string | null
          site_id: string
        }
        Update: {
          budget?: number
          campaign_date?: string
          campaign_name?: string
          created_at?: string
          ctr?: number | null
          id?: string
          notes?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_intel_past_campaigns_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "web_intel_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      web_intel_sites: {
        Row: {
          category: string | null
          country: string
          created_at: string
          created_by: string | null
          entity: string | null
          estimated_monthly_traffic: number | null
          id: string
          name: string
          notes: string | null
          tags: string[] | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          entity?: string | null
          estimated_monthly_traffic?: number | null
          id?: string
          name: string
          notes?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          entity?: string | null
          estimated_monthly_traffic?: number | null
          id?: string
          name?: string
          notes?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          url?: string
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
      saved_elements_unified: {
        Row: {
          ad_group_id: string | null
          approval_status: string | null
          campaign_id: string | null
          created_at: string | null
          element_type: string | null
          entity: string | null
          id: string | null
          name: string | null
        }
        Relationships: []
      }
      task_comment_counts: {
        Row: {
          comment_count: number | null
          task_id: string | null
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
    }
    Functions: {
      calculate_actual_hours: { Args: { task_uuid: string }; Returns: number }
      cleanup_expired_mfa_sessions: { Args: never; Returns: undefined }
      cleanup_old_mfa_attempts: { Args: never; Returns: undefined }
      cleanup_rate_limit: { Args: never; Returns: undefined }
      detect_language: { Args: { content_text: string }; Returns: string }
      extract_client_ip: { Args: { ip_chain: string }; Returns: string }
      get_admin_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_all_users_admin: {
        Args: never
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
      get_users_in_teams: {
        Args: { team_names: string[] }
        Returns: {
          name: string
          profile_id: string
          user_id: string
        }[]
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
      is_notification_enabled: {
        Args: { p_notification_type: string; p_user_id: string }
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
      regenerate_backup_codes: { Args: never; Returns: string[] }
      reschedule_overdue_tasks: { Args: never; Returns: undefined }
      send_notification:
        | {
            Args: {
              p_link?: string
              p_message: string
              p_metadata?: Json
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: { p_payload_json: Json; p_type: string; p_user_id: string }
            Returns: undefined
          }
      validate_mfa_session: {
        Args: { session_token: string }
        Returns: boolean
      }
      validate_mfa_session_with_ip: {
        Args: { p_ip_address: string; p_session_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      campaign_type:
        | "paid_search"
        | "social"
        | "email"
        | "display"
        | "affiliate"
        | "referral"
        | "organic"
      location_type:
        | "Airport Media"
        | "LED Tower"
        | "3D Digital Vessel"
        | "Building Wrap"
        | "Iconic Art (Station Wrap)"
        | "Station Wrap (Generic)"
        | "Digital Unipole"
        | "LED Unipole"
        | "Megacom"
        | "Megacom Board"
        | "Hoarding"
        | "TPS / Hoarding"
        | "Bridge"
        | "Bridge Banner"
        | "Static Bridge Banner"
        | "LED Screen"
        | "Digital Screen"
        | "Destination Display"
        | "Light Box"
        | "Vertical Light Box"
        | "Piers (Backlit Lightbox)"
        | "Lamppost"
        | "Mupi"
        | "Mupi Board"
        | "Mupi Digital"
        | "Bus Shelter"
        | "Metro Pillars (Backlit Lightbox)"
        | "In-Mall Screen"
        | "Elevator Screen"
        | "Wall Banner"
        | "Glass Wrap"
      task_priority: "High" | "Medium" | "Low"
      task_source: "native" | "jira"
      task_status: "Pending" | "Ongoing" | "Failed" | "Blocked" | "Completed"
      task_type: "task" | "campaign_launch" | "operations"
      task_visibility: "global" | "pool" | "private"
      team: "SocialUA" | "PPC" | "PerMar"
      utm_status: "active" | "paused" | "archived"
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
      campaign_type: [
        "paid_search",
        "social",
        "email",
        "display",
        "affiliate",
        "referral",
        "organic",
      ],
      location_type: [
        "Airport Media",
        "LED Tower",
        "3D Digital Vessel",
        "Building Wrap",
        "Iconic Art (Station Wrap)",
        "Station Wrap (Generic)",
        "Digital Unipole",
        "LED Unipole",
        "Megacom",
        "Megacom Board",
        "Hoarding",
        "TPS / Hoarding",
        "Bridge",
        "Bridge Banner",
        "Static Bridge Banner",
        "LED Screen",
        "Digital Screen",
        "Destination Display",
        "Light Box",
        "Vertical Light Box",
        "Piers (Backlit Lightbox)",
        "Lamppost",
        "Mupi",
        "Mupi Board",
        "Mupi Digital",
        "Bus Shelter",
        "Metro Pillars (Backlit Lightbox)",
        "In-Mall Screen",
        "Elevator Screen",
        "Wall Banner",
        "Glass Wrap",
      ],
      task_priority: ["High", "Medium", "Low"],
      task_source: ["native", "jira"],
      task_status: ["Pending", "Ongoing", "Failed", "Blocked", "Completed"],
      task_type: ["task", "campaign_launch", "operations"],
      task_visibility: ["global", "pool", "private"],
      team: ["SocialUA", "PPC", "PerMar"],
      utm_status: ["active", "paused", "archived"],
    },
  },
} as const
