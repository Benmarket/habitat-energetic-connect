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
      action_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          advertiser_id: string
          badge_text: string | null
          badge_type: string | null
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          features: string[] | null
          id: string
          image: string | null
          is_featured: boolean
          original_price: number | null
          price: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          badge_text?: string | null
          badge_type?: string | null
          created_at?: string
          cta_text?: string
          cta_url: string
          description: string
          features?: string[] | null
          id?: string
          image?: string | null
          is_featured?: boolean
          original_price?: number | null
          price?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          badge_text?: string | null
          badge_type?: string | null
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          features?: string[] | null
          id?: string
          image?: string | null
          is_featured?: boolean
          original_price?: number | null
          price?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisers: {
        Row: {
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      article_automations: {
        Row: {
          created_at: string | null
          frequency_cron: string
          id: string
          instructions: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency_cron: string
          id?: string
          instructions: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency_cron?: string
          id?: string
          instructions?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      button_presets: {
        Row: {
          align: string
          background_color: string
          border_color: string
          border_radius: number
          border_style: string
          border_width: number
          created_at: string
          custom_width: number
          description: string | null
          favorite_order: number | null
          gradient_angle: number
          gradient_color1: string
          gradient_color2: string
          gradient_type: string
          hover_effect: boolean
          hover_gradient_shift: boolean
          id: string
          is_favorite: boolean
          name: string
          padding_x: number
          padding_y: number
          shadow_size: string
          size: string
          text: string
          text_color: string
          updated_at: string
          url: string
          use_gradient: boolean
          user_id: string
          width: string
        }
        Insert: {
          align?: string
          background_color?: string
          border_color?: string
          border_radius?: number
          border_style?: string
          border_width?: number
          created_at?: string
          custom_width?: number
          description?: string | null
          favorite_order?: number | null
          gradient_angle?: number
          gradient_color1?: string
          gradient_color2?: string
          gradient_type?: string
          hover_effect?: boolean
          hover_gradient_shift?: boolean
          id?: string
          is_favorite?: boolean
          name: string
          padding_x?: number
          padding_y?: number
          shadow_size?: string
          size?: string
          text?: string
          text_color?: string
          updated_at?: string
          url?: string
          use_gradient?: boolean
          user_id: string
          width?: string
        }
        Update: {
          align?: string
          background_color?: string
          border_color?: string
          border_radius?: number
          border_style?: string
          border_width?: number
          created_at?: string
          custom_width?: number
          description?: string | null
          favorite_order?: number | null
          gradient_angle?: number
          gradient_color1?: string
          gradient_color2?: string
          gradient_type?: string
          hover_effect?: boolean
          hover_gradient_shift?: boolean
          id?: string
          is_favorite?: boolean
          name?: string
          padding_x?: number
          padding_y?: number
          shadow_size?: string
          size?: string
          text?: string
          text_color?: string
          updated_at?: string
          url?: string
          use_gradient?: boolean
          user_id?: string
          width?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_agent_requests: {
        Row: {
          accepted_at: string | null
          assigned_agent_id: string | null
          conversation_id: string
          created_at: string | null
          id: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_agent_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string
          first_name: string
          id: string
          is_owner: boolean | null
          last_name: string
          latitude: number | null
          longitude: number | null
          needs: string[] | null
          notes: string | null
          phone: string | null
          postal_code: string
          property_type: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_owner?: boolean | null
          last_name: string
          latitude?: number | null
          longitude?: number | null
          needs?: string[] | null
          notes?: string | null
          phone?: string | null
          postal_code: string
          property_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_owner?: boolean | null
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          needs?: string[] | null
          notes?: string | null
          phone?: string | null
          postal_code?: string
          property_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number | null
          filename: string
          height: number | null
          id: string
          mime_type: string | null
          storage_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          excerpt: string | null
          faq: Json | null
          featured_image: string | null
          focus_keywords: string[] | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          slug: string
          source: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          tldr: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          excerpt?: string | null
          faq?: Json | null
          featured_image?: string | null
          focus_keywords?: string[] | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          tldr?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          excerpt?: string | null
          faq?: Json | null
          featured_image?: string | null
          focus_keywords?: string[] | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug?: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          tldr?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "moderator" | "user"
      content_type: "actualite" | "guide" | "aide" | "annonce"
      lead_status: "new" | "contacted" | "qualified" | "converted" | "rejected"
      post_status: "draft" | "published" | "archived"
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
      app_role: ["super_admin", "admin", "moderator", "user"],
      content_type: ["actualite", "guide", "aide", "annonce"],
      lead_status: ["new", "contacted", "qualified", "converted", "rejected"],
      post_status: ["draft", "published", "archived"],
    },
  },
} as const
