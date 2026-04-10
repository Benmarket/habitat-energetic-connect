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
      ad_analytics: {
        Row: {
          advertisement_id: string
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          referrer: string | null
          region_code: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          advertisement_id: string
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          region_code?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          advertisement_id?: string
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          region_code?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_region_featured: {
        Row: {
          advertisement_id: string
          created_at: string
          display_order: number
          id: string
          region_code: string
        }
        Insert: {
          advertisement_id: string
          created_at?: string
          display_order?: number
          id?: string
          region_code: string
        }
        Update: {
          advertisement_id?: string
          created_at?: string
          display_order?: number
          id?: string
          region_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_region_featured_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          advertiser_id: string
          badge_text: string | null
          badge_type: string | null
          clicks_count: number
          conversions_count: number
          created_at: string
          cta_text: string
          cta_url: string | null
          description: string
          expires_at: string | null
          features: string[] | null
          id: string
          image: string | null
          is_featured: boolean
          is_rge_certified: boolean
          original_price: number | null
          price: number | null
          product_type: string | null
          rge_certification_text: string | null
          status: string
          target_regions: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          advertiser_id: string
          badge_text?: string | null
          badge_type?: string | null
          clicks_count?: number
          conversions_count?: number
          created_at?: string
          cta_text?: string
          cta_url?: string | null
          description: string
          expires_at?: string | null
          features?: string[] | null
          id?: string
          image?: string | null
          is_featured?: boolean
          is_rge_certified?: boolean
          original_price?: number | null
          price?: number | null
          product_type?: string | null
          rge_certification_text?: string | null
          status?: string
          target_regions?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          advertiser_id?: string
          badge_text?: string | null
          badge_type?: string | null
          clicks_count?: number
          conversions_count?: number
          created_at?: string
          cta_text?: string
          cta_url?: string | null
          description?: string
          expires_at?: string | null
          features?: string[] | null
          id?: string
          image?: string | null
          is_featured?: boolean
          is_rge_certified?: boolean
          original_price?: number | null
          price?: number | null
          product_type?: string | null
          rge_certification_text?: string | null
          status?: string
          target_regions?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
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
          city: string | null
          contact_email: string | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          intervention_departments: string[] | null
          intervention_radius_km: number | null
          is_active: boolean
          logo: string | null
          name: string
          postal_code: string | null
          region: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          intervention_departments?: string[] | null
          intervention_radius_km?: number | null
          is_active?: boolean
          logo?: string | null
          name: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          intervention_departments?: string[] | null
          intervention_radius_km?: number | null
          is_active?: boolean
          logo?: string | null
          name?: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          called_at: string
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          called_at?: string
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          called_at?: string
          endpoint?: string
          id?: string
          user_id?: string
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
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          created_by: string | null
          id: string
          job_title: string | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          job_title?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          job_title?: string | null
          name?: string
          updated_at?: string
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
          expired_at: string | null
          id: string
          notified_user: boolean | null
          status: string | null
          timeout_minutes: number | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          conversation_id: string
          created_at?: string | null
          expired_at?: string | null
          id?: string
          notified_user?: boolean | null
          status?: string | null
          timeout_minutes?: number | null
        }
        Update: {
          accepted_at?: string | null
          assigned_agent_id?: string | null
          conversation_id?: string
          created_at?: string | null
          expired_at?: string | null
          id?: string
          notified_user?: boolean | null
          status?: string | null
          timeout_minutes?: number | null
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
          closed_at: string | null
          closed_reason: string | null
          created_at: string | null
          flow_id: string | null
          flow_responses: Json | null
          id: string
          ip_address: string | null
          last_seen_at: string | null
          page_url: string | null
          referrer: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string | null
          flow_id?: string | null
          flow_responses?: Json | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          page_url?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_reason?: string | null
          created_at?: string | null
          flow_id?: string | null
          flow_responses?: Json | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string | null
          page_url?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "chatbot_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
          sender_name?: string | null
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
      chatbot_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_main: boolean | null
          name: string
          show_back_button: boolean | null
          tree_structure: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean | null
          name: string
          show_back_button?: boolean | null
          tree_structure?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_main?: boolean | null
          name?: string
          show_back_button?: boolean | null
          tree_structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      cta_banners: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          description: string | null
          favorite_order: number | null
          id: string
          is_favorite: boolean | null
          name: string
          secondary_color: string | null
          subtitle: string | null
          template_style: string
          text_color: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          description?: string | null
          favorite_order?: number | null
          id?: string
          is_favorite?: boolean | null
          name: string
          secondary_color?: string | null
          subtitle?: string | null
          template_style?: string
          text_color?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          description?: string | null
          favorite_order?: number | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          secondary_color?: string | null
          subtitle?: string | null
          template_style?: string
          text_color?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      form_configurations: {
        Row: {
          created_at: string
          description: string | null
          fields_schema: Json
          form_identifier: string
          id: string
          name: string
          updated_at: string
          webhook_enabled: boolean
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields_schema?: Json
          form_identifier: string
          id?: string
          name: string
          updated_at?: string
          webhook_enabled?: boolean
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fields_schema?: Json
          form_identifier?: string
          id?: string
          name?: string
          updated_at?: string
          webhook_enabled?: boolean
          webhook_url?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          data: Json
          form_id: string
          id: string
          ip_address: string | null
          is_read: boolean
          status: string
          submitted_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          data: Json
          form_id: string
          id?: string
          ip_address?: string | null
          is_read?: boolean
          status?: string
          submitted_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          data?: Json
          form_id?: string
          id?: string
          ip_address?: string | null
          is_read?: boolean
          status?: string
          submitted_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_images: {
        Row: {
          created_at: string
          file_size: number | null
          filename: string
          id: string
          ip_address: string | null
          mime_type: string | null
          post_id: string | null
          storage_path: string
          topic_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          filename: string
          id?: string
          ip_address?: string | null
          mime_type?: string | null
          post_id?: string | null
          storage_path: string
          topic_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          filename?: string
          id?: string
          ip_address?: string | null
          mime_type?: string | null
          post_id?: string | null
          storage_path?: string
          topic_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_images_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
          topic_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
          topic_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_id: string
          category_id: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          slug: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          category_id: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          slug: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          slug?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          bg_color: string
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          level: string
          parent_id: string | null
          path: string
          region_code: string | null
          regional_content: Json | null
          seo_status: string
          seo_status_changed_at: string | null
          slug: string
          title: string
          updated_at: string
          variant_slug: string | null
        }
        Insert: {
          bg_color?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level?: string
          parent_id?: string | null
          path: string
          region_code?: string | null
          regional_content?: Json | null
          seo_status?: string
          seo_status_changed_at?: string | null
          slug: string
          title: string
          updated_at?: string
          variant_slug?: string | null
        }
        Update: {
          bg_color?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level?: string
          parent_id?: string | null
          path?: string
          region_code?: string | null
          regional_content?: Json | null
          seo_status?: string
          seo_status_changed_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
          variant_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
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
      page_views: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          page_url: string
          referrer: string | null
          region_code: string
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_url: string
          referrer?: string | null
          region_code?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_url?: string
          referrer?: string | null
          region_code?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
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
      popup_templates: {
        Row: {
          accent_color: string | null
          animation: string
          background_color: string | null
          badge_color: string | null
          close_button_style: string | null
          created_at: string
          id: string
          name: string
          overlay_opacity: number | null
          position: string
          show_close_button: boolean
          size: string
          template: string
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          animation?: string
          background_color?: string | null
          badge_color?: string | null
          close_button_style?: string | null
          created_at?: string
          id?: string
          name: string
          overlay_opacity?: number | null
          position?: string
          show_close_button?: boolean
          size?: string
          template?: string
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          animation?: string
          background_color?: string | null
          badge_color?: string | null
          close_button_style?: string | null
          created_at?: string
          id?: string
          name?: string
          overlay_opacity?: number | null
          position?: string
          show_close_button?: boolean
          size?: string
          template?: string
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          accent_color: string | null
          animation: string
          background_color: string | null
          background_image: string | null
          badge_color: string | null
          badge_text: string | null
          close_button_style: string | null
          created_at: string
          custom_template_name: string | null
          delay_seconds: number
          form_id: string | null
          frequency: string
          id: string
          is_active: boolean
          is_custom_template: boolean
          name: string
          overlay_opacity: number | null
          position: string
          show_close_button: boolean
          size: string
          subtitle: string | null
          target_categories: string[] | null
          target_page: string
          template: string
          text_color: string | null
          title: string | null
          trigger_id: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          animation?: string
          background_color?: string | null
          background_image?: string | null
          badge_color?: string | null
          badge_text?: string | null
          close_button_style?: string | null
          created_at?: string
          custom_template_name?: string | null
          delay_seconds?: number
          form_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          is_custom_template?: boolean
          name: string
          overlay_opacity?: number | null
          position?: string
          show_close_button?: boolean
          size?: string
          subtitle?: string | null
          target_categories?: string[] | null
          target_page?: string
          template?: string
          text_color?: string | null
          title?: string | null
          trigger_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          animation?: string
          background_color?: string | null
          background_image?: string | null
          badge_color?: string | null
          badge_text?: string | null
          close_button_style?: string | null
          created_at?: string
          custom_template_name?: string | null
          delay_seconds?: number
          form_id?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          is_custom_template?: boolean
          name?: string
          overlay_opacity?: number | null
          position?: string
          show_close_button?: boolean
          size?: string
          subtitle?: string | null
          target_categories?: string[] | null
          target_page?: string
          template?: string
          text_color?: string | null
          title?: string | null
          trigger_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "popups_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_configurations"
            referencedColumns: ["id"]
          },
        ]
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
          author_display_type: string | null
          author_id: string
          badge_image: string | null
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          custom_author_name: string | null
          display_author_id: string | null
          download_count: number
          excerpt: string | null
          faq: Json | null
          featured_image: string | null
          focus_keywords: string[] | null
          generation_cost: number | null
          guide_template: string | null
          hide_author: boolean
          id: string
          is_downloadable: boolean
          is_members_only: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          scheduled_publish_at: string | null
          slug: string
          source: string | null
          status: Database["public"]["Enums"]["post_status"]
          target_audience: string[] | null
          target_regions: string[] | null
          template_colors: Json | null
          title: string
          tldr: string | null
          topline: string | null
          topline_bg_color: string | null
          topline_text_color: string | null
          updated_at: string
        }
        Insert: {
          author_display_type?: string | null
          author_id: string
          badge_image?: string | null
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          custom_author_name?: string | null
          display_author_id?: string | null
          download_count?: number
          excerpt?: string | null
          faq?: Json | null
          featured_image?: string | null
          focus_keywords?: string[] | null
          generation_cost?: number | null
          guide_template?: string | null
          hide_author?: boolean
          id?: string
          is_downloadable?: boolean
          is_members_only?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          target_audience?: string[] | null
          target_regions?: string[] | null
          template_colors?: Json | null
          title: string
          tldr?: string | null
          topline?: string | null
          topline_bg_color?: string | null
          topline_text_color?: string | null
          updated_at?: string
        }
        Update: {
          author_display_type?: string | null
          author_id?: string
          badge_image?: string | null
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          custom_author_name?: string | null
          display_author_id?: string | null
          download_count?: number
          excerpt?: string | null
          faq?: Json | null
          featured_image?: string | null
          focus_keywords?: string[] | null
          generation_cost?: number | null
          guide_template?: string | null
          hide_author?: boolean
          id?: string
          is_downloadable?: boolean
          is_members_only?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug?: string
          source?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          target_audience?: string[] | null
          target_regions?: string[] | null
          template_colors?: Json | null
          title?: string
          tldr?: string | null
          topline?: string | null
          topline_bg_color?: string | null
          topline_text_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_display_author_id_fkey"
            columns: ["display_author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
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
      regions: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulator_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          simulator_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          simulator_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          simulator_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      solar_simulator_global_params: {
        Row: {
          angle_inclinaison: number
          hausse_electricite: number
          hausse_electricite_graph: number
          id: string
          periode_calcul: number
          ratio_jour: number
          updated_at: string
        }
        Insert: {
          angle_inclinaison?: number
          hausse_electricite?: number
          hausse_electricite_graph?: number
          id?: string
          periode_calcul?: number
          ratio_jour?: number
          updated_at?: string
        }
        Update: {
          angle_inclinaison?: number
          hausse_electricite?: number
          hausse_electricite_graph?: number
          id?: string
          periode_calcul?: number
          ratio_jour?: number
          updated_at?: string
        }
        Relationships: []
      }
      solar_simulator_powers: {
        Row: {
          created_at: string
          display_order: number
          id: string
          prix_euros: number
          puissance_kwc: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          prix_euros: number
          puissance_kwc: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          prix_euros?: number
          puissance_kwc?: number
          updated_at?: string
        }
        Relationships: []
      }
      solar_simulator_regions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          module_puissance_defaut: string
          name: string
          postal_prefixes: string[] | null
          prime_0_3: number
          prime_10_36: number
          prime_101_500: number
          prime_37_100: number
          prime_4_9: number
          tarif_kwh: number
          tarif_rachat_0_3: number
          tarif_rachat_10_36: number
          tarif_rachat_101_500: number
          tarif_rachat_37_100: number
          tarif_rachat_4_9: number
          updated_at: string
          variation_prix_installation: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          module_puissance_defaut?: string
          name: string
          postal_prefixes?: string[] | null
          prime_0_3?: number
          prime_10_36?: number
          prime_101_500?: number
          prime_37_100?: number
          prime_4_9?: number
          tarif_kwh?: number
          tarif_rachat_0_3?: number
          tarif_rachat_10_36?: number
          tarif_rachat_101_500?: number
          tarif_rachat_37_100?: number
          tarif_rachat_4_9?: number
          updated_at?: string
          variation_prix_installation?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          module_puissance_defaut?: string
          name?: string
          postal_prefixes?: string[] | null
          prime_0_3?: number
          prime_10_36?: number
          prime_101_500?: number
          prime_37_100?: number
          prime_4_9?: number
          tarif_kwh?: number
          tarif_rachat_0_3?: number
          tarif_rachat_10_36?: number
          tarif_rachat_101_500?: number
          tarif_rachat_37_100?: number
          tarif_rachat_4_9?: number
          updated_at?: string
          variation_prix_installation?: number
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
      visitor_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      forum_images_safe: {
        Row: {
          created_at: string | null
          file_size: number | null
          filename: string | null
          id: string | null
          ip_address: string | null
          mime_type: string | null
          post_id: string | null
          storage_path: string | null
          topic_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string | null
          ip_address?: never
          mime_type?: string | null
          post_id?: string | null
          storage_path?: string | null
          topic_id?: string | null
          user_agent?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          filename?: string | null
          id?: string | null
          ip_address?: never
          mime_type?: string | null
          post_id?: string | null
          storage_path?: string | null
          topic_id?: string | null
          user_agent?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_images_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_ad_analytics_rate: {
        Args: { p_visitor_id: string }
        Returns: boolean
      }
      check_ai_rate_limit: {
        Args: { p_endpoint: string; p_max_per_hour?: number; p_user_id: string }
        Returns: boolean
      }
      check_form_submission_rate: { Args: { p_ip: string }; Returns: boolean }
      check_lead_rate: { Args: { p_email: string }; Returns: boolean }
      check_newsletter_rate: { Args: { p_email: string }; Returns: boolean }
      check_page_view_rate: {
        Args: { p_ip: string; p_visitor_id: string }
        Returns: boolean
      }
      current_visitor_id: { Args: never; Returns: string }
      expire_stale_agent_requests: { Args: never; Returns: undefined }
      has_permission:
        | {
            Args: { _permission_code: string; _user_id: string }
            Returns: boolean
          }
        | {
            Args: { _permission_code: string; _user_id: string }
            Returns: boolean
          }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      issue_visitor_session: {
        Args: { p_expires_in_seconds?: number }
        Returns: Json
      }
      mark_abandoned_conversations: { Args: never; Returns: undefined }
      record_ai_call: {
        Args: { p_endpoint: string; p_user_id: string }
        Returns: undefined
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
