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
      backorders_notifications: {
        Row: {
          created_at: string
          customer_response_date: string | null
          id: string
          notified_date: string | null
          public_note: string | null
          shopify_line_item_id: string
          shopify_order_id: string
          shopify_order_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_response_date?: string | null
          id?: string
          notified_date?: string | null
          public_note?: string | null
          shopify_line_item_id: string
          shopify_order_id: string
          shopify_order_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_response_date?: string | null
          id?: string
          notified_date?: string | null
          public_note?: string | null
          shopify_line_item_id?: string
          shopify_order_id?: string
          shopify_order_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_stats: {
        Row: {
          id: string
          last_updated: string
          stats_data: Json
          stats_type: string
        }
        Insert: {
          id?: string
          last_updated?: string
          stats_data: Json
          stats_type: string
        }
        Update: {
          id?: string
          last_updated?: string
          stats_data?: Json
          stats_type?: string
        }
        Relationships: []
      }
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
        Relationships: []
      }
      hd_combined_allocated: {
        Row: {
          created_at: string
          hd_oderline_allocated: number | null
          hd_orderline_quantity: number | null
          hd_orderlinecombo: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hd_oderline_allocated?: number | null
          hd_orderline_quantity?: number | null
          hd_orderlinecombo?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hd_oderline_allocated?: number | null
          hd_orderline_quantity?: number | null
          hd_orderlinecombo?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hd_line_items_exclude: {
        Row: {
          created_at: string
          hd_order_number: string
          hd_orderlinecombo: string | null
          id: string
          line_number: string | null
          part_number: string | null
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hd_order_number: string
          hd_orderlinecombo?: string | null
          id?: string
          line_number?: string | null
          part_number?: string | null
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hd_order_number?: string
          hd_orderlinecombo?: string | null
          id?: string
          line_number?: string | null
          part_number?: string | null
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
        Relationships: []
      }
      hd_order_settings_table: {
        Row: {
          created_at: string
          description: string | null
          id: number
          setting_name: string
          setting_type: string
          setting_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          setting_name: string
          setting_type: string
          setting_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          setting_name?: string
          setting_type?: string
          setting_value?: number
          updated_at?: string
        }
        Relationships: []
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
      iron_city_new_orders_table: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          hd_orderlinecombo: string | null
          id: string
          iron_anyaction: boolean | null
          iron_created: string | null
          iron_last_updated: string | null
          iron_notes: string | null
          iron_order_quantity: number | null
          iron_picked_quantity: number | null
          iron_progress: string | null
          order_id: string | null
          pinnacle_bin_location: string | null
          pinnacle_close_match: boolean | null
          pinnacle_cost: number | null
          pinnacle_description: string | null
          pinnacle_exact_match: boolean | null
          pinnacle_more_than_one_match: boolean | null
          pinnacle_part_number: string | null
          pinnacle_stock_quantity: number | null
          price: number | null
          price_ex_vat: number | null
          quantity: number | null
          quantity_exceeds_picked: boolean | null
          shopify_line_item_id: string | null
          shopify_notes: string | null
          shopify_order_number: string | null
          sku: string | null
          snapshot_date: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          hd_orderlinecombo?: string | null
          id?: string
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          order_id?: string | null
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          price?: number | null
          price_ex_vat?: number | null
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          hd_orderlinecombo?: string | null
          id?: string
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          order_id?: string | null
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          price?: number | null
          price_ex_vat?: number | null
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      iron_city_order_progress: {
        Row: {
          created_at: string
          dealer_po_number: string | null
          hd_orderlinecombo: string | null
          id: string
          is_partial: boolean | null
          notes: string | null
          pinnacle_last_checked_date: string | null
          pinnacle_qty_when_ordered: number | null
          pinnacle_sku_matched: string | null
          progress: string | null
          quantity: number | null
          quantity_ordered: number | null
          quantity_picked: number | null
          quantity_required: number | null
          shopify_line_item_id: string
          shopify_order_number: string | null
          shopify_ordersku_combo: string | null
          sku: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_po_number?: string | null
          hd_orderlinecombo?: string | null
          id?: string
          is_partial?: boolean | null
          notes?: string | null
          pinnacle_last_checked_date?: string | null
          pinnacle_qty_when_ordered?: number | null
          pinnacle_sku_matched?: string | null
          progress?: string | null
          quantity?: number | null
          quantity_ordered?: number | null
          quantity_picked?: number | null
          quantity_required?: number | null
          shopify_line_item_id: string
          shopify_order_number?: string | null
          shopify_ordersku_combo?: string | null
          sku: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_po_number?: string | null
          hd_orderlinecombo?: string | null
          id?: string
          is_partial?: boolean | null
          notes?: string | null
          pinnacle_last_checked_date?: string | null
          pinnacle_qty_when_ordered?: number | null
          pinnacle_sku_matched?: string | null
          progress?: string | null
          quantity?: number | null
          quantity_ordered?: number | null
          quantity_picked?: number | null
          quantity_required?: number | null
          shopify_line_item_id?: string
          shopify_order_number?: string | null
          shopify_ordersku_combo?: string | null
          sku?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
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
      pinnacle_stock_lookup_table: {
        Row: {
          bin_location: string | null
          corrected_sku: string | null
          cost: number | null
          description: string | null
          id: number
          stock_quantity: number | null
        }
        Insert: {
          bin_location?: string | null
          corrected_sku?: string | null
          cost?: number | null
          description?: string | null
          id?: number
          stock_quantity?: number | null
        }
        Update: {
          bin_location?: string | null
          corrected_sku?: string | null
          cost?: number | null
          description?: string | null
          id?: number
          stock_quantity?: number | null
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
      track_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      track_order_usage: {
        Row: {
          created_date: string
          id: string
          shopify_order_number: string
        }
        Insert: {
          created_date?: string
          id?: string
          shopify_order_number: string
        }
        Update: {
          created_date?: string
          id?: string
          shopify_order_number?: string
        }
        Relationships: []
      }
      track_shopify_order: {
        Row: {
          archive_status: string | null
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
          archive_status?: string | null
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
          archive_status?: string | null
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
      track_shopify_order_lines: {
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
            foreignKeyName: "track_shopify_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "track_shopify_order"
            referencedColumns: ["id"]
          },
        ]
      }
      track_shopify_refunded_lines: {
        Row: {
          admin_user: string | null
          amount: number | null
          created_at: string
          currency_code: string | null
          id: string
          note: string | null
          order_id: string
          quantity: number
          reason: string | null
          refund_created_at: string
          restock: boolean | null
          shopify_line_item_id: string
          shopify_refund_id: string
        }
        Insert: {
          admin_user?: string | null
          amount?: number | null
          created_at?: string
          currency_code?: string | null
          id?: string
          note?: string | null
          order_id: string
          quantity: number
          reason?: string | null
          refund_created_at: string
          restock?: boolean | null
          shopify_line_item_id: string
          shopify_refund_id: string
        }
        Update: {
          admin_user?: string | null
          amount?: number | null
          created_at?: string
          currency_code?: string | null
          id?: string
          note?: string | null
          order_id?: string
          quantity?: number
          reason?: string | null
          refund_created_at?: string
          restock?: boolean | null
          shopify_line_item_id?: string
          shopify_refund_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_shopify_refunded_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "track_shopify_order"
            referencedColumns: ["id"]
          },
        ]
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
      database_health_stats: {
        Row: {
          location_names_status: string | null
          orders_table_count: number | null
          partial_orders_count: number | null
          shopify_order_lines_count: number | null
          to_pick_count: number | null
          unique_ic_progress_status: string | null
        }
        Relationships: []
      }
      hd_combined: {
        Row: {
          backorder_clear_by: string | null
          customer_expected_date: string | null
          dealer_po_number: string | null
          description: string | null
          expected_arrival_dealership: string | null
          hd_order_number: string | null
          hd_orderlinecombo: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_backorder: boolean | null
          is_invoiced: boolean | null
          line_number: string | null
          open_quantity: number | null
          order_date: string | null
          order_quantity: number | null
          part_number: string | null
          price_totaled: number | null
          status: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      hd_combined_distinct: {
        Row: {
          backorder_clear_by: string | null
          customer_expected_date: string | null
          dealer_po_number: string | null
          description: string | null
          expected_arrival_dealership: string | null
          hd_order_number: string | null
          hd_orderlinecombo: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_backorder: boolean | null
          is_invoiced: boolean | null
          line_number: string | null
          open_quantity: number | null
          order_date: string | null
          order_quantity: number | null
          part_number: string | null
          price_totaled: number | null
          status: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      hd_dashboard_stats: {
        Row: {
          backorder_items: number | null
          last_backorders_upload: string | null
          last_line_items_upload: string | null
          last_open_orders_upload: string | null
          orders_without_line_items: number | null
          total_orders: number | null
        }
        Relationships: []
      }
      hd_order_matches: {
        Row: {
          dealer_po_number: string | null
          expected_arrival_dealership: string | null
          hd_order_number: string | null
          hd_orderlinecombo: string | null
          matched_quantity: number | null
          order_date: string | null
          order_quantity: number | null
          part_number: string | null
          status: string | null
        }
        Relationships: []
      }
      hd_orders_status_summary: {
        Row: {
          contains_open_orders: boolean | null
          dealer_po_number: string | null
          hd_order_number: string | null
          order_date: string | null
          order_type: string | null
          updated_date: string | null
        }
        Relationships: []
      }
      hd_orders_with_lookup: {
        Row: {
          dealer_po_number: string | null
          has_line_items: boolean | null
          hd_order_number: string | null
          is_excluded: boolean | null
          order_date: string | null
          order_type: string | null
        }
        Insert: {
          dealer_po_number?: string | null
          has_line_items?: never
          hd_order_number?: string | null
          is_excluded?: never
          order_date?: string | null
          order_type?: string | null
        }
        Update: {
          dealer_po_number?: string | null
          has_line_items?: never
          hd_order_number?: string | null
          is_excluded?: never
          order_date?: string | null
          order_type?: string | null
        }
        Relationships: []
      }
      hd_orders_with_status: {
        Row: {
          contains_open_orders: boolean | null
          dealer_po_number: string | null
          has_shopify_match: boolean | null
          hd_order_number: string | null
          order_date: string | null
          order_type: string | null
          order_updated_at: string | null
        }
        Relationships: []
      }
      iron_city_action_viewer: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          hd_orderlinecombo: string | null
          iron_anyaction: boolean | null
          iron_created: string | null
          iron_last_updated: string | null
          iron_notes: string | null
          iron_order_quantity: number | null
          iron_picked_quantity: number | null
          iron_progress: string | null
          order_id: string | null
          pinnacle_bin_location: string | null
          pinnacle_close_match: boolean | null
          pinnacle_cost: number | null
          pinnacle_description: string | null
          pinnacle_exact_match: boolean | null
          pinnacle_more_than_one_match: boolean | null
          pinnacle_part_number: string | null
          pinnacle_stock_quantity: number | null
          price: number | null
          price_ex_vat: number | null
          quantity: number | null
          quantity_exceeds_picked: boolean | null
          shopify_line_item_id: string | null
          shopify_notes: string | null
          shopify_order_number: string | null
          sku: string | null
          title: string | null
        }
        Relationships: []
      }
      iron_city_action_viewer2: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          hd_orderlinecombo: string | null
          iron_anyaction: boolean | null
          iron_created: string | null
          iron_last_updated: string | null
          iron_notes: string | null
          iron_order_quantity: number | null
          iron_picked_quantity: number | null
          iron_progress: string | null
          order_id: string | null
          pinnacle_bin_location: string | null
          pinnacle_close_match: boolean | null
          pinnacle_cost: number | null
          pinnacle_description: string | null
          pinnacle_exact_match: boolean | null
          pinnacle_more_than_one_match: boolean | null
          pinnacle_part_number: string | null
          pinnacle_stock_quantity: number | null
          price: number | null
          price_ex_vat: number | null
          quantity: number | null
          quantity_exceeds_picked: boolean | null
          shopify_line_item_id: string | null
          shopify_notes: string | null
          shopify_order_number: string | null
          sku: string | null
          title: string | null
        }
        Relationships: []
      }
      iron_city_dispatch_complete_view: {
        Row: {
          all_items_same_staus: boolean | null
          all_orderline_count: number | null
          customer_email: string | null
          customer_name: string | null
          is_full_order_check: boolean | null
          not_full_contains_complete: boolean | null
          "Order Date": string | null
          order_id: string | null
          potential_cancelled: boolean | null
          progress: string | null
          progress_orderline_count: number | null
          quantity: number | null
          quantity_picked: number | null
          ready_and_complete: boolean | null
          shopify_line_item_id: string | null
          shopify_order_number: string | null
          sku: string | null
          title: string | null
        }
        Relationships: []
      }
      iron_city_ordered_view: {
        Row: {
          current_stock_quantity: number | null
          customer_expected_date: string | null
          customer_name: string | null
          dealer_po_number: string | null
          expected_arrival_dealership: string | null
          hd_order_quantity: number | null
          hd_orderlinecombo: string | null
          hd_part_number: string | null
          hd_status: string | null
          is_backorder: boolean | null
          notes: string | null
          order_date: string | null
          ordered_quantity: number | null
          pinnacle_qty_when_ordered: number | null
          price: number | null
          progress: string | null
          required_quantity: number | null
          shopify_line_item_id: string | null
          shopify_order_number: string | null
          sku: string | null
          title: string | null
        }
        Insert: {
          current_stock_quantity?: never
          customer_expected_date?: never
          customer_name?: string | null
          dealer_po_number?: never
          expected_arrival_dealership?: never
          hd_order_quantity?: never
          hd_orderlinecombo?: never
          hd_part_number?: never
          hd_status?: never
          is_backorder?: never
          notes?: never
          order_date?: string | null
          ordered_quantity?: never
          pinnacle_qty_when_ordered?: never
          price?: number | null
          progress?: never
          required_quantity?: number | null
          shopify_line_item_id?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          title?: string | null
        }
        Update: {
          current_stock_quantity?: never
          customer_expected_date?: never
          customer_name?: string | null
          dealer_po_number?: never
          expected_arrival_dealership?: never
          hd_order_quantity?: never
          hd_orderlinecombo?: never
          hd_part_number?: never
          hd_status?: never
          is_backorder?: never
          notes?: never
          order_date?: string | null
          ordered_quantity?: never
          pinnacle_qty_when_ordered?: never
          price?: number | null
          progress?: never
          required_quantity?: number | null
          shopify_line_item_id?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          title?: string | null
        }
        Relationships: []
      }
      iron_city_ordered_view_v2: {
        Row: {
          backorder_clear_by: string | null
          contains_matches: boolean | null
          customer_expected_date: string | null
          dealer_po_number: string | null
          hd_order_number: string | null
          hd_orderlinecombo: string | null
          is_backorder: boolean | null
          is_invoiced: boolean | null
          matched_status_ordered: boolean | null
          notes: string | null
          order_date: string | null
          part_number: string | null
          predicted_dealership_arrival: string | null
          progress: string | null
          shopify_order_number: string | null
          sku: string | null
          status: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          hd_orderlinecombo: string | null
          hdc_backorder_clear: string | null
          hdc_customer_expected: string | null
          hdc_invoice_date: string | null
          hdc_is_backorder: boolean | null
          hdc_status: string | null
          id: string | null
          iron_anyaction: boolean | null
          iron_created: string | null
          iron_cust_expected_date: string | null
          iron_last_updated: string | null
          iron_notes: string | null
          iron_order_quantity: number | null
          iron_picked_quantity: number | null
          iron_progress: string | null
          order_id: string | null
          pinnacle_bin_location: string | null
          pinnacle_close_match: boolean | null
          pinnacle_cost: number | null
          pinnacle_description: string | null
          pinnacle_exact_match: boolean | null
          pinnacle_more_than_one_match: boolean | null
          pinnacle_part_number: string | null
          pinnacle_stock_quantity: number | null
          predicted_dealership_arrival: string | null
          price: number | null
          price_ex_vat: number | null
          quantity: number | null
          quantity_exceeds_picked: boolean | null
          shopify_line_item_id: string | null
          shopify_notes: string | null
          shopify_order_number: string | null
          sku: string | null
          snapshot_date: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          hd_orderlinecombo?: string | null
          hdc_backorder_clear?: never
          hdc_customer_expected?: never
          hdc_invoice_date?: never
          hdc_is_backorder?: never
          hdc_status?: never
          id?: string | null
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_cust_expected_date?: never
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          order_id?: string | null
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          predicted_dealership_arrival?: never
          price?: number | null
          price_ex_vat?: number | null
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          hd_orderlinecombo?: string | null
          hdc_backorder_clear?: never
          hdc_customer_expected?: never
          hdc_invoice_date?: never
          hdc_is_backorder?: never
          hdc_status?: never
          id?: string | null
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_cust_expected_date?: never
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          order_id?: string | null
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          predicted_dealership_arrival?: never
          price?: number | null
          price_ex_vat?: number | null
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data_backorders: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_response_date: string | null
          dealer_po_number: string | null
          hd_orderlinecombo: string | null
          hdc_backorder_clear: string | null
          hdc_customer_expected: string | null
          hdc_invoice_date: string | null
          hdc_is_backorder: boolean | null
          hdc_status: string | null
          id: string | null
          iron_anyaction: boolean | null
          iron_created: string | null
          iron_cust_expected_date: string | null
          iron_last_updated: string | null
          iron_notes: string | null
          iron_order_quantity: number | null
          iron_picked_quantity: number | null
          iron_progress: string | null
          notified_date: string | null
          order_id: string | null
          orders_with_backorders: boolean | null
          orders_with_notification: boolean | null
          pinnacle_bin_location: string | null
          pinnacle_close_match: boolean | null
          pinnacle_cost: number | null
          pinnacle_description: string | null
          pinnacle_exact_match: boolean | null
          pinnacle_more_than_one_match: boolean | null
          pinnacle_part_number: string | null
          pinnacle_stock_quantity: number | null
          predicted_dealership_arrival: string | null
          price: number | null
          price_ex_vat: number | null
          public_note: string | null
          quantity: number | null
          quantity_exceeds_picked: boolean | null
          shopify_line_item_id: string | null
          shopify_notes: string | null
          shopify_order_number: string | null
          sku: string | null
          snapshot_date: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_response_date?: never
          dealer_po_number?: never
          hd_orderlinecombo?: string | null
          hdc_backorder_clear?: never
          hdc_customer_expected?: never
          hdc_invoice_date?: never
          hdc_is_backorder?: never
          hdc_status?: never
          id?: string | null
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_cust_expected_date?: never
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          notified_date?: never
          order_id?: string | null
          orders_with_backorders?: never
          orders_with_notification?: never
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          predicted_dealership_arrival?: never
          price?: number | null
          price_ex_vat?: number | null
          public_note?: never
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_response_date?: never
          dealer_po_number?: never
          hd_orderlinecombo?: string | null
          hdc_backorder_clear?: never
          hdc_customer_expected?: never
          hdc_invoice_date?: never
          hdc_is_backorder?: never
          hdc_status?: never
          id?: string | null
          iron_anyaction?: boolean | null
          iron_created?: string | null
          iron_cust_expected_date?: never
          iron_last_updated?: string | null
          iron_notes?: string | null
          iron_order_quantity?: number | null
          iron_picked_quantity?: number | null
          iron_progress?: string | null
          notified_date?: never
          order_id?: string | null
          orders_with_backorders?: never
          orders_with_notification?: never
          pinnacle_bin_location?: string | null
          pinnacle_close_match?: boolean | null
          pinnacle_cost?: number | null
          pinnacle_description?: string | null
          pinnacle_exact_match?: boolean | null
          pinnacle_more_than_one_match?: boolean | null
          pinnacle_part_number?: string | null
          pinnacle_stock_quantity?: number | null
          predicted_dealership_arrival?: never
          price?: number | null
          price_ex_vat?: number | null
          public_note?: never
          quantity?: number | null
          quantity_exceeds_picked?: boolean | null
          shopify_line_item_id?: string | null
          shopify_notes?: string | null
          shopify_order_number?: string | null
          sku?: string | null
          snapshot_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data_backorders_disp: {
        Row: {
          created_at: string | null
          customer_name: string | null
          order_id: string | null
          shopify_order_number: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data_backorders_or: {
        Row: {
          created_at: string | null
          customer_name: string | null
          order_id: string | null
          shopify_order_number: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data_backorders_pk: {
        Row: {
          created_at: string | null
          customer_name: string | null
          order_id: string | null
          shopify_order_number: string | null
        }
        Relationships: []
      }
      iron_city_orders_with_hd_data_backorders_tp: {
        Row: {
          created_at: string | null
          customer_name: string | null
          order_id: string | null
          shopify_order_number: string | null
        }
        Relationships: []
      }
      iron_city_picked_view: {
        Row: {
          customer_email: string | null
          customer_name: string | null
          is_partial: boolean | null
          notes: string | null
          order_date: string | null
          order_id: string | null
          pinnacle_sku_matched: string | null
          progress_status: string | null
          quantity_picked: number | null
          ready_for_dispatch: boolean | null
          required_quantity: number | null
          shopify_line_item_id: string | null
          shopify_order_number: string | null
          sku: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
      pinnacle_stock_view: {
        Row: {
          bin_location: string | null
          corrected_sku: string | null
          cost: number | null
          description: string | null
          part_no: string | null
          stock_quantity: number | null
        }
        Insert: {
          bin_location?: string | null
          corrected_sku?: never
          cost?: number | null
          description?: string | null
          part_no?: string | null
          stock_quantity?: number | null
        }
        Update: {
          bin_location?: string | null
          corrected_sku?: never
          cost?: number | null
          description?: string | null
          part_no?: string | null
          stock_quantity?: number | null
        }
        Relationships: []
      }
      track_shopify_calc_view: {
        Row: {
          archive_status: string | null
          backorder_clear_by: string | null
          backorder_notified_date: string | null
          backorder_public_note: string | null
          backorder_response_date: string | null
          customer_email: string | null
          customer_expected_date: string | null
          customer_name: string | null
          hd_orderlinecombo: string | null
          hd_status: string | null
          icop_updated_at: string | null
          is_backorder: boolean | null
          location_name: string | null
          order_line_refunded: boolean | null
          progress: string | null
          quantity: number | null
          shopify_line_item_id: string | null
          shopify_order_date: string | null
          shopify_order_id: string | null
          shopify_order_number: string | null
          sku: string | null
          status: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_sku_corrections: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      call_tracker_single_order_import: {
        Args: { order_number: string }
        Returns: Json
      }
      clean_iron_city_new_orders_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      daily_shopify_refresh_job: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_all_shopify_order_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_all_shopify_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_all_tracking_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      get_dashboard_stats: {
        Args: { stats_type_param: string }
        Returns: Json
      }
      get_hd_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_pinnacle_cost: {
        Args: { sql_sku: string }
        Returns: number
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
      refresh_iron_city_new_orders_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_iron_city_new_orders_table_structure: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_orders: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_stock_and_orders_data2: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      shopify_delete_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      shopify_import_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      shopify_location_sweep_up: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      shopify_sync_locations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_dashboard_stats: {
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
