export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      capacity_status: {
        Row: {
          circuit_breaks_today: number
          cognitive_capacity: string
          communication_preference: string
          created_at: string | null
          date: string
          id: string
          label: string | null
          last_debugging_circuit: string | null
          trigger_sensitivity: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          circuit_breaks_today?: number
          cognitive_capacity: string
          communication_preference: string
          created_at?: string | null
          date: string
          id?: string
          label?: string | null
          last_debugging_circuit?: string | null
          trigger_sensitivity: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          circuit_breaks_today?: number
          cognitive_capacity?: string
          communication_preference?: string
          created_at?: string | null
          date?: string
          id?: string
          label?: string | null
          last_debugging_circuit?: string | null
          trigger_sensitivity?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capacity_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clarification_responses: {
        Row: {
          assumption_index: number
          clarification_id: string
          created_at: string
          id: string
          label: string | null
          responder_id: string
          response_status: string
        }
        Insert: {
          assumption_index: number
          clarification_id: string
          created_at?: string
          id?: string
          label?: string | null
          responder_id: string
          response_status: string
        }
        Update: {
          assumption_index?: number
          clarification_id?: string
          created_at?: string
          id?: string
          label?: string | null
          responder_id?: string
          response_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarification_responses_clarification_id_fkey"
            columns: ["clarification_id"]
            isOneToOne: false
            referencedRelation: "clarifications"
            referencedColumns: ["id"]
          },
        ]
      }
      clarifications: {
        Row: {
          assumptions: string
          clarification_uuid: string | null
          created_at: string
          id: string
          label: string | null
          proposer_id: string
          status: string
          topic: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          assumptions: string
          clarification_uuid?: string | null
          created_at?: string
          id?: string
          label?: string | null
          proposer_id: string
          status?: string
          topic: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          assumptions?: string
          clarification_uuid?: string | null
          created_at?: string
          id?: string
          label?: string | null
          proposer_id?: string
          status?: string
          topic?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_events: {
        Row: {
          content: Json
          created_at: string | null
          event_type: string
          id: string
          resolved: boolean
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          event_type: string
          id?: string
          resolved?: boolean
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          event_type?: string
          id?: string
          resolved?: boolean
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_modes: {
        Row: {
          active: boolean | null
          active_topic: string | null
          break_acknowledged_by: string[] | null
          break_count_today: number | null
          created_at: string | null
          current_mode: string | null
          description: string | null
          icon: string | null
          id: string
          label: string | null
          last_break_timestamp: string | null
          name: string
          partner_acknowledged: boolean | null
          paused_until: string | null
          timeout_end: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          active?: boolean | null
          active_topic?: string | null
          break_acknowledged_by?: string[] | null
          break_count_today?: number | null
          created_at?: string | null
          current_mode?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string | null
          last_break_timestamp?: string | null
          name: string
          partner_acknowledged?: boolean | null
          paused_until?: string | null
          timeout_end?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          active?: boolean | null
          active_topic?: string | null
          break_acknowledged_by?: string[] | null
          break_count_today?: number | null
          created_at?: string | null
          current_mode?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string | null
          last_break_timestamp?: string | null
          name?: string
          partner_acknowledged?: boolean | null
          paused_until?: string | null
          timeout_end?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_modes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_loops: {
        Row: {
          closed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          label: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debug_loops_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          achieved_date: string | null
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          achieved_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          achieved_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_workspace_id: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          active_workspace_id?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          goal_id: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: number
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_status: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          status: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          status: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          label: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_workspace: {
        Args:
          | Record<PropertyKey, never>
          | { p_workspace_name: string; p_workspace_description?: string }
        Returns: string
      }
      get_daily_briefing_members: {
        Args: { p_workspace_id: string }
        Returns: {
          user_id: string
          name: string
          email: string
          avatar_url: string
          last_active: string
          status: string
          custom_status: string
        }[]
      }
      get_projects_for_goal: {
        Args: { p_goal_id: string; p_user_id: string }
        Returns: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          category: string
          completion_percentage: number
          start_date: string
          target_completion_date: string
          created_at: string
          updated_at: string
        }[]
      }
      get_user_goals_with_stats: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          category: string
          target_date: string
          start_date: string
          completion_percentage: number
          parent_goal_id: string
          tags: Json
          metrics: Json
          completed_at: string
          goal_uuid: string
          created_at: string
          updated_at: string
          sub_goals_count: number
          projects_count: number
        }[]
      }
      get_user_projects_with_stats: {
        Args: { p_user_id: string; p_workspace_id: string }
        Returns: {
          id: string
          goal_id: string
          title: string
          description: string
          status: string
          priority: string
          category: string
          start_date: string
          target_completion_date: string
          actual_completion_date: string
          estimated_duration: number
          actual_duration: number
          completion_percentage: number
          tags: Json
          milestones: Json
          resources: Json
          project_uuid: string
          created_at: string
          updated_at: string
          tasks_count: number
          completed_tasks_count: number
          events_count: number
          goal_title: string
        }[]
      }
      is_workspace_member: {
        Args: { p_workspace_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      goal_status: "proposed" | "active" | "achieved" | "abandoned"
      project_status:
        | "planning"
        | "active"
        | "on-hold"
        | "completed"
        | "archived"
      task_status:
        | "pending"
        | "in-progress"
        | "completed"
        | "deferred"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      goal_status: ["proposed", "active", "achieved", "abandoned"],
      project_status: [
        "planning",
        "active",
        "on-hold",
        "completed",
        "archived",
      ],
      task_status: [
        "pending",
        "in-progress",
        "completed",
        "deferred",
        "cancelled",
      ],
    },
  },
} as const
