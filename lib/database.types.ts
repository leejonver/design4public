export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          slug: string;
          name_ko: string;
          name_en: string | null;
          description: string | null;
          cover_image_url: string | null;
          logo_image_url: string | null;
          website_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_ko: string;
          name_en?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          logo_image_url?: string | null;
          website_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_ko?: string;
          name_en?: string | null;
          description?: string | null;
          cover_image_url?: string | null;
          logo_image_url?: string | null;
          website_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          brand_id: string | null;
          nara_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          brand_id?: string | null;
          nara_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          brand_id?: string | null;
          nara_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          }
        ];
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          year: number | null;
          area: number | null;
          location: string | null;
          client: string | null;
          inquiry_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          year?: number | null;
          area?: number | null;
          location?: string | null;
          client?: string | null;
          inquiry_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          year?: number | null;
          area?: number | null;
          location?: string | null;
          client?: string | null;
          inquiry_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          image_url: string;
          alt_text: string | null;
          title: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          alt_text?: string | null;
          title?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          alt_text?: string | null;
          title?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: Database["public"]["Enums"]["category_type"];
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: Database["public"]["Enums"]["category_type"];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["category_type"];
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      project_photos: {
        Row: {
          id: string;
          project_id: string;
          photo_id: string;
          is_main: boolean;
          order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          photo_id: string;
          is_main?: boolean;
          order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          photo_id?: string;
          is_main?: boolean;
          order?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_photos_photo_id_fkey";
            columns: ["photo_id"];
            isOneToOne: false;
            referencedRelation: "photos";
            referencedColumns: ["id"];
          }
        ];
      };
      photo_items: {
        Row: {
          id: string;
          photo_id: string;
          item_id: string;
          is_main: boolean;
          order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          photo_id: string;
          item_id: string;
          is_main?: boolean;
          order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          photo_id?: string;
          item_id?: string;
          is_main?: boolean;
          order?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photo_items_photo_id_fkey";
            columns: ["photo_id"];
            isOneToOne: false;
            referencedRelation: "photos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photo_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          }
        ];
      };
      project_items: {
        Row: {
          project_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          item_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          }
        ];
      };
      project_categories: {
        Row: {
          project_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_categories_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      item_categories: {
        Row: {
          item_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          item_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          category_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_categories_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      project_tags: {
        Row: { project_id: string; tag_id: string; created_at: string };
        Insert: { project_id: string; tag_id: string; created_at?: string };
        Update: { project_id?: string; tag_id?: string; created_at?: string };
        Relationships: [];
      };
      item_tags: {
        Row: { item_id: string; tag_id: string; created_at: string };
        Insert: { item_id: string; tag_id: string; created_at?: string };
        Update: { item_id?: string; tag_id?: string; created_at?: string };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          project_slug: string | null;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          project_slug?: string | null;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          project_slug?: string | null;
          message?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          status: ApprovalStatus;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          status?: ApprovalStatus;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: UserRole;
          status?: ApprovalStatus;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: boolean;
          featured_project_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          featured_project_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          featured_project_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_featured_project_id_fkey";
            columns: ["featured_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      home_featured: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          order?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      category_type: "project" | "item";
    };
    CompositeTypes: Record<string, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      category_type: ["project", "item"],
    },
  },
} as const;

/* --- Named enum aliases consumed by admin code (auth.ts, AuthContext).
   TODO(post-M1): replace with Enums<'...'> derivations from Database. --- */
export type UserRole = 'master' | 'admin' | 'content_manager'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ProjectStatus = 'draft' | 'published' | 'hidden'
export type ItemStatus = 'available' | 'discontinued' | 'hidden'
export type BrandStatus = 'visible' | 'hidden'
export type CategoryType = 'project' | 'item'
