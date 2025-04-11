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
      hd_backorders: {
        Row: {
          backorder_clear_by: string | null
          created_at: string
          dealer_po_number: string | null
          description: string | null
          hd_order_number: string
          id: string
          line_item_id: string | null
          line_number: string | null
          order_date: string | null
          part_number: string
          projected_shipping_date: string | null
          projected_shipping_quantity: number | null
          quantity: number | null
          total_price: number | null
          updated_at: string
          upload_batch_id: string
        }
        Insert: {
          backorder_clear_by?: string | null
          created_at?: string
          dealer_po_number?: string | null
          description?: string | null
          hd_order_number: string
          id?: string
          line_item_id?: string | null
          line_number?: string | null
          order_date?: string | null
          part_number: string
          projected_shipping_date?: string | null
          projected_shipping_quantity?: number | null
          quantity?: number | null
          total_price?: number | null
          updated_at?: string
          upload_batch_id: string
        }
        Update: {
          backorder_clear_by?: string | null
          created_at?: string
          dealer_po_number?: string | null
          description?: string | null
          hd_order_number?: string
          id?: string
          line_item_id?: string | null
          line_number?: string | null
          order_date?: string | null
          part_number?: string
          projected_shipping_date?: string | null
          projected_shipping_quantity?: number | null
          quantity?: number | null
          total_price?: number | null
          updated_at?: string
          upload_batch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_backorders_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "hd_order_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_line_items_exclude: {
        Row: {
          created_at: string
          hd_order_number: string
          id: string
          line_number: string | null
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hd_order_number: string
          id?: string
          line_number?: string | null
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hd_order_number?: string
          id?: string
          line_number?: string | null
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      hd_lineitems_exclude: {
        Row: {
          created_at: string
          hd_order_number: string
          id: string
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hd_order_number: string
          id?: string
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hd_order_number?: string
          id?: string
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      hd_order_line_items: {
        Row: {
          backorder_clear_by: string | null
          created_at: string
          dealer_po_number: string | null
          description: string | null
          hd_order_id: string | null
          hd_order_number: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_backorder: boolean | null
          line_number: string | null
          open_quantity: number | null
          order_date: string | null
          order_quantity: number | null
          part_number: string | null
          projected_shipping_date: string | null
          projected_shipping_quantity: number | null
          status: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          backorder_clear_by?: string | null
          created_at?: string
          dealer_po_number?: string | null
          description?: string | null
          hd_order_id?: string | null
          hd_order_number: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_backorder?: boolean | null
          line_number?: string | null
          open_quantity?: number | null
          order_date?: string | null
          order_quantity?: number | null
          part_number?: string | null
          projected_shipping_date?: string | null
          projected_shipping_quantity?: number | null
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          backorder_clear_by?: string | null
          created_at?: string
          dealer_po_number?: string | null
          description?: string | null
          hd_order_id?: string | null
          hd_order_number?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_backorder?: boolean | null
          line_number?: string | null
          open_quantity?: number | null
          order_date?: string | null
          order_quantity?: number | null
          part_number?: string | null
          projected_shipping_date?: string | null
          projected_shipping_quantity?: number | null
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hd_order_line_items_hd_order_id_fkey"
            columns: ["hd_order_id"]
            isOneToOne: false
            referencedRelation: "hd_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hd_orders: {
        Row: {
          created_at: string
          dealer_po_number: string | null
          has_line_items: boolean | null
          hd_order_number: string
          id: string
          notes: string | null
          order_date: string | null
          order_type: string | null
          ship_to: string | null
          terms: string | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_po_number?: string | null
          has_line_items?: boolean | null
          hd_order_number: string
          id?: string
          notes?: string | null
          order_date?: string | null
          order_type?: string | null
          ship_to?: string | null
          terms?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_po_number?: string | null
          has_line_items?: boolean | null
          hd_order_number?: string
          id?: string
          notes?: string | null
          order_date?: string | null
          order_type?: string | null
          ship_to?: string | null
          terms?: string | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hd_upload_history: {
        Row: {
          error_message: string | null
          filename: string
          id: string
          items_count: number
          replaced_previous: boolean
          status: string
          upload_date: string
          upload_type: string
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          filename: string
          id?: string
          items_count?: number
          replaced_previous?: boolean
          status: string
          upload_date?: string
          upload_type: string
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          filename?: string
          id?: string
          items_count?: number
          replaced_previous?: boolean
          status?: string
          upload_date?: string
          upload_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      iron_city_order_progress: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          progress: string | null
          shopify_order_id: string
          shopify_order_number: string | null
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          progress?: string | null
          shopify_order_id: string
          shopify_order_number?: string | null
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          progress?: string | null
          shopify_order_id?: string
          shopify_order_number?: string | null
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_iron_city_order_progress_shopify_order"
            columns: ["shopify_order_id"]
            isOneToOne: false
            referencedRelation: "shopify_orders"
            referencedColumns: ["shopify_order_id"]
          },
        ]
      }
      pinnacle_sku_corrections: {
        Row: {
          corrected_part_no: string
          created_at: string
          created_by: string | null
          id: string
          last_applied_at: string | null
          notes: string | null
          original_part_no: string
          updated_at: string
        }
        Insert: {
          corrected_part_no: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_applied_at?: string | null
          notes?: string | null
          original_part_no: string
          updated_at?: string
        }
        Update: {
          corrected_part_no?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_applied_at?: string | null
          notes?: string | null
          original_part_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      pinnacle_stock: {
        Row: {
          average_cost: number | null
          bin_location: string | null
          cost: number | null
          description: string | null
          id: string
          last_updated: string | null
          part_no: string
          product_group: string | null
          retail_price: number | null
          stock_quantity: number | null
          total_average_cost: number | null
          total_cost: number | null
          total_retail: number | null
        }
        Insert: {
          average_cost?: number | null
          bin_location?: string | null
          cost?: number | null
          description?: string | null
          id?: string
          last_updated?: string | null
          part_no: string
          product_group?: string | null
          retail_price?: number | null
          stock_quantity?: number | null
          total_average_cost?: number | null
          total_cost?: number | null
          total_retail?: number | null
        }
        Update: {
          average_cost?: number | null
          bin_location?: string | null
          cost?: number | null
          description?: string | null
          id?: string
          last_updated?: string | null
          part_no?: string
          product_group?: string | null
          retail_price?: number | null
          stock_quantity?: number | null
          total_average_cost?: number | null
          total_cost?: number | null
          total_retail?: number | null
        }
        Relationships: []
      }
      pinnacle_upload_history: {
        Row: {
          error_message: string | null
          filename: string
          id: string
          records_count: number
          status: string
          upload_timestamp: string | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          filename: string
          id?: string
          records_count: number
          status: string
          upload_timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          filename?: string
          id?: string
          records_count?: number
          status?: string
          upload_timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shopify_archived_order_items: {
        Row: {
          archived_at: string
          archived_order_id: string
          created_at: string
          id: string
          location_id: string | null
          location_name: string | null
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
          location_id?: string | null
          location_name?: string | null
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
          location_id?: string | null
          location_name?: string | null
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
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          shopify_order_number: string | null
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
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id: string
          shopify_order_number?: string | null
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
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id?: string
          shopify_order_number?: string | null
          status?: string
        }
        Relationships: []
      }
      shopify_order_items: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          location_name: string | null
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
          location_id?: string | null
          location_name?: string | null
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
          location_id?: string | null
          location_name?: string | null
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
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          shopify_order_number: string | null
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
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id: string
          shopify_order_number?: string | null
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
          metadata?: Json | null
          note?: string | null
          shipping_address?: Json | null
          shopify_order_id?: string
          shopify_order_number?: string | null
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
      apply_sku_corrections: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
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
          metadata: Json | null
          note: string | null
          shipping_address: Json | null
          shopify_order_id: string
          shopify_order_number: string | null
          status: string
        }[]
      }
      get_hd_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
