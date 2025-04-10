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
      shopify_archived_order_items: {
        Row: {
          archived_at: string
          archived_order_id: string
          created_at: string
          id: string
          price: number | null
          product_id: string | null
          properties: Json | null
          quantity: number
          shopify_line_item_id: string
          sku: string | null
          title: string
          variant_id: string | null
        }
        Insert: {
          archived_at?: string
          archived_order_id: string
          created_at?: string
          id?: string
          price?: number | null
          product_id?: string | null
          properties?: Json | null
          quantity: number
          shopify_line_item_id: string
          sku?: string | null
          title: string
          variant_id?: string | null
        }
        Update: {
          archived_at?: string
          archived_order_id?: string
          created_at?: string
          id?: string
          price?: number | null
          product_id?: string | null
          properties?: Json | null
          quantity?: number
          shopify_line_item_id?: string
          sku?: string | null
          title?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_archived_order_items_archived_order_id_fkey"
            columns: ["archived_order_id"]
            isOneToOne: false
            referencedRelation: "shopify_archived_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_archived_orders: {
        Row: {
          archived_at: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          imported_at: string
          items_count: number
          line_items: Json | null
          location_id: string | null
          location_name: string | null
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          status: string
        }
        Insert: {
          archived_at?: string
          created_at: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          imported_at?: string
          items_count: number
          line_items?: Json | null
          location_id?: string | null
          location_name?: string | null
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id: string
          status: string
        }
        Update: {
          archived_at?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          imported_at?: string
          items_count?: number
          line_items?: Json | null
          location_id?: string | null
          location_name?: string | null
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id?: string
          status?: string
        }
        Relationships: []
      }
      shopify_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number | null
          product_id: string | null
          properties: Json | null
          quantity: number
          shopify_line_item_id: string
          sku: string | null
          title: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price?: number | null
          product_id?: string | null
          properties?: Json | null
          quantity: number
          shopify_line_item_id: string
          sku?: string | null
          title: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number | null
          product_id?: string | null
          properties?: Json | null
          quantity?: number
          shopify_line_item_id?: string
          sku?: string | null
          title?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shopify_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          imported_at: string
          items_count: number
          line_items: Json | null
          location_id: string | null
          location_name: string | null
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          status: string
        }
        Insert: {
          created_at: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          imported_at?: string
          items_count: number
          line_items?: Json | null
          location_id?: string | null
          location_name?: string | null
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          imported_at?: string
          items_count?: number
          line_items?: Json | null
          location_id?: string | null
          location_name?: string | null
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id?: string
          status?: string
        }
        Relationships: []
      }
      shopify_settings: {
        Row: {
          created_at: string
          id: string
          setting_name: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      execute_sql: {
        Args: { sql: string }
        Returns: Json[]
      }
      get_archived_shopify_orders: {
        Args: { limit_count: number }
        Returns: {
          archived_at: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          imported_at: string
          items_count: number
          line_items: Json | null
          location_id: string | null
          location_name: string | null
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          status: string
        }[]
      }
      get_shopify_order_number: {
        Args: { order_id: string }
        Returns: string
      }
      get_shopify_setting: {
        Args: { setting_name_param: string }
        Returns: string
      }
      migrate_existing_order_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_shopify_setting: {
        Args: { setting_name_param: string; setting_value_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
