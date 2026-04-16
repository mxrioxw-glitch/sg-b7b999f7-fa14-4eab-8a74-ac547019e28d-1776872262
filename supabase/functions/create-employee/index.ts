import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user making the request
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse request body
    const { email, password, full_name, business_id, role = "cashier" } = await req.json();

    if (!email || !password || !full_name || !business_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: email, password, full_name, business_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify the requesting user is the owner of the business
    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ success: false, error: "Business not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (business.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Only business owner can create employees" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Create the user account with admin privileges
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        is_employee: true,
      },
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ success: false, error: createError?.message || "Failed to create user account" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email,
        full_name,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert({
        user_id: newUser.user.id,
        business_id,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (employeeError) {
      console.error("Error creating employee record:", employeeError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create employee record" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Create default permissions
    const defaultPermissions = role === "admin"
      ? [
          { module: "pos", can_read: true, can_write: true },
          { module: "products", can_read: true, can_write: true },
          { module: "inventory", can_read: true, can_write: true },
          { module: "customers", can_read: true, can_write: true },
          { module: "cash_register", can_read: true, can_write: true },
          { module: "reports", can_read: true, can_write: false },
        ]
      : [
          { module: "pos", can_read: true, can_write: true },
          { module: "cash_register", can_read: true, can_write: true },
        ];

    const permissionsToInsert = defaultPermissions.map((p) => ({
      employee_id: employee.id,
      ...p,
    }));

    await supabaseAdmin
      .from("employee_permissions")
      .insert(permissionsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          id: employee.id,
          email,
          full_name,
          role,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});