 
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          accent_color: string | null
          address: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          pos_name: string | null
          primary_color: string | null
          printer_width: number | null
          secondary_color: string | null
          slug: string | null
          tax_included: boolean | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          pos_name?: string | null
          primary_color?: string | null
          printer_width?: number | null
          secondary_color?: string | null
          slug?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          pos_name?: string | null
          primary_color?: string | null
          printer_width?: number | null
          secondary_color?: string | null
          slug?: string | null
          tax_included?: boolean | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          business_id: string
          closing_amount: number | null
          closing_time: string | null
          created_at: string
          difference: number | null
          employee_id: string
          expected_amount: number | null
          id: string
          notes: string | null
          opening_amount: number
          opening_time: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          closing_amount?: number | null
          closing_time?: string | null
          created_at?: string
          difference?: number | null
          employee_id: string
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opening_amount?: number
          opening_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          closing_amount?: number | null
          closing_time?: string | null
          created_at?: string
          difference?: number | null
          employee_id?: string
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opening_amount?: number
          opening_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          business_id: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string
          employee_id: string
          id: string
          module: string
          updated_at: string
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          employee_id: string
          id?: string
          module: string
          updated_at?: string
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          employee_id?: string
          id?: string
          module?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean | null
          pin_code: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          pin_code?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          pin_code?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reason: string
          status: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason: string
          status?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          business_id: string
          cost_per_unit: number | null
          created_at: string
          current_stock: number | null
          id: string
          min_stock: number | null
          name: string
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          business_id: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name: string
          sku?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          business_id?: string
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name?: string
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          new_stock: number
          notes: string | null
          previous_stock: number
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          sort_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          sort_order?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_extras: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          product_id: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
          product_id: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          product_id?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_extras_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_inventory_items: {
        Row: {
          created_at: string
          extra_id: string | null
          id: string
          inventory_item_id: string
          product_id: string
          quantity_per_unit: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          extra_id?: string | null
          id?: string
          inventory_item_id: string
          product_id: string
          quantity_per_unit: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          extra_id?: string | null
          id?: string
          inventory_item_id?: string
          product_id?: string
          quantity_per_unit?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_items_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "product_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          created_at: string
          id: string
          name: string
          price_modifier: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          id?: string
          name: string
          price_modifier?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          created_at?: string
          id?: string
          name?: string
          price_modifier?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          base_price: number
          business_id: string
          category_id: string | null
          created_at: string
          description: string | null
          generates_points: boolean | null
          has_extras: boolean | null
          has_variants: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_value: number | null
          sku: string | null
          tax_rate: number | null
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          base_price: number
          business_id: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          generates_points?: boolean | null
          has_extras?: boolean | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_value?: number | null
          sku?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          base_price?: number
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          generates_points?: boolean | null
          has_extras?: boolean | null
          has_variants?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_value?: number | null
          sku?: string | null
          tax_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_item_extras: {
        Row: {
          created_at: string
          extra_id: string | null
          extra_name: string
          id: string
          price: number
          sale_item_id: string
        }
        Insert: {
          created_at?: string
          extra_id?: string | null
          extra_name: string
          id?: string
          price: number
          sale_item_id: string
        }
        Update: {
          created_at?: string
          extra_id?: string | null
          extra_name?: string
          id?: string
          price?: number
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_item_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "product_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_extras_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          tax_amount: number
          total: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          subtotal: number
          tax_amount?: number
          total: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method_id: string | null
          payment_type: string
          reference_code: string | null
          sale_id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          payment_type: string
          reference_code?: string | null
          sale_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method_id?: string | null
          payment_type?: string
          reference_code?: string | null
          sale_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          cash_register_id: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          employee_id: string | null
          id: string
          notes: string | null
          points_earned: number | null
          points_redeemed: number | null
          receipt_number: string | null
          status: string
          subtotal: number
          tax_amount: number
          tip_amount: number | null
          total: number
          updated_at: string
        }
        Insert: {
          business_id: string
          cash_register_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          receipt_number?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          cash_register_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          employee_id?: string | null
          id?: string
          notes?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          receipt_number?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      table_order_item_extras: {
        Row: {
          created_at: string
          extra_id: string | null
          extra_name: string
          id: string
          price: number
          table_order_item_id: string
        }
        Insert: {
          created_at?: string
          extra_id?: string | null
          extra_name: string
          id?: string
          price: number
          table_order_item_id: string
        }
        Update: {
          created_at?: string
          extra_id?: string | null
          extra_name?: string
          id?: string
          price?: number
          table_order_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_order_item_extras_extra_id_fkey"
            columns: ["extra_id"]
            isOneToOne: false
            referencedRelation: "product_extras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_item_extras_table_order_item_id_fkey"
            columns: ["table_order_item_id"]
            isOneToOne: false
            referencedRelation: "table_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      table_order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          sent_to_kitchen_at: string | null
          served_at: string | null
          status: string
          subtotal: number
          table_order_id: string
          tax_amount: number
          total: number
          unit_price: number
          updated_at: string
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          sent_to_kitchen_at?: string | null
          served_at?: string | null
          status?: string
          subtotal: number
          table_order_id: string
          tax_amount?: number
          total: number
          unit_price: number
          updated_at?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          sent_to_kitchen_at?: string | null
          served_at?: string | null
          status?: string
          subtotal?: number
          table_order_id?: string
          tax_amount?: number
          total?: number
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_items_table_order_id_fkey"
            columns: ["table_order_id"]
            isOneToOne: false
            referencedRelation: "table_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_orders: {
        Row: {
          assigned_waiter_id: string | null
          business_id: string
          closed_at: string | null
          created_at: string
          customer_id: string | null
          guests_count: number | null
          id: string
          notes: string | null
          opened_at: string
          status: string
          subtotal: number
          table_id: string
          tax_amount: number
          tip_amount: number | null
          total: number
          updated_at: string
        }
        Insert: {
          assigned_waiter_id?: string | null
          business_id: string
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          guests_count?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          status?: string
          subtotal?: number
          table_id: string
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          assigned_waiter_id?: string | null
          business_id?: string
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          guests_count?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          status?: string
          subtotal?: number
          table_id?: string
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_orders_assigned_waiter_id_fkey"
            columns: ["assigned_waiter_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          area: string | null
          business_id: string
          capacity: number
          created_at: string
          current_order_id: string | null
          id: string
          is_active: boolean | null
          status: string
          table_number: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          business_id: string
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          status?: string
          table_number: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          business_id?: string
          capacity?: number
          created_at?: string
          current_order_id?: string | null
          id?: string
          is_active?: boolean | null
          status?: string
          table_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_current_order_id_fkey"
            columns: ["current_order_id"]
            isOneToOne: false
            referencedRelation: "table_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      promote_to_super_admin: {
        Args: { user_email: string }
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
    Enums: {},
  },
} as const
