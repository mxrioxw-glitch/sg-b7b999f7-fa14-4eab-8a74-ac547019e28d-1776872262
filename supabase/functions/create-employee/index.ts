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
    console.log("=== CREATE EMPLOYEE FUNCTION STARTED ===");
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
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
      console.error("Invalid token:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    console.log("Request by user:", user.email);

    // Parse request body
    const { email, password, full_name, business_id, role = "cashier" } = await req.json();
    console.log("Creating employee:", { email, full_name, business_id, role });

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
      console.error("Business not found:", businessError);
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

    console.log("Creating auth user...");

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

    console.log("User created:", newUser.user.id);

    // Create profile entry (UPSERT to avoid conflicts with trigger)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email,
        full_name,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to create profile: ${profileError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Profile created");

    // Check if employee already exists
    const { data: existingEmployee } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("user_id", newUser.user.id)
      .eq("business_id", business_id)
      .maybeSingle();

    if (existingEmployee) {
      console.error("Employee already exists");
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ success: false, error: "Este usuario ya es empleado de este negocio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Creating employee record...");

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
      console.error("Error creating employee:", employeeError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      await supabaseAdmin.from("profiles").delete().eq("id", newUser.user.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to create employee: ${employeeError.message}`,
          details: employeeError.details,
          hint: employeeError.hint,
          code: employeeError.code
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Employee created:", employee.id);
    console.log("Skipping permissions creation for now - will be added manually");

    // PERMISSIONS DISABLED TEMPORARILY TO DEBUG
    // Will create permissions manually in the UI

    console.log("=== SUCCESS ===");

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          id: employee.id,
          email,
          full_name,
          role,
        },
        message: "Employee created successfully. Please set permissions manually in the UI."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error",
        stack: error.stack
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});