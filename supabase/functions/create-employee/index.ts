import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user auth to verify permissions
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get request body
    const { email, password, full_name, business_id, role = "cashier" } = await req.json();

    // Validate inputs
    if (!email || !password || !business_id) {
      throw new Error("Missing required fields: email, password, business_id");
    }

    // Verify user owns this business
    const { data: business, error: businessError } = await supabaseUser
      .from("businesses")
      .select("owner_id")
      .eq("id", business_id)
      .single();

    if (businessError || !business || business.owner_id !== user.id) {
      throw new Error("You don't have permission to add employees to this business");
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.find((u) => u.email === email);

    if (userExists) {
      throw new Error("A user with this email already exists");
    }

    // Create the user using admin API (this bypasses normal registration)
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || email.split("@")[0],
      },
    });

    if (createUserError || !newUser.user) {
      console.error("Error creating user:", createUserError);
      throw new Error(createUserError?.message || "Failed to create user");
    }

    console.log("User created:", newUser.user.id);

    // Create profile (the trigger should handle this, but we'll do it manually to be sure)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email: email,
        full_name: full_name || email.split("@")[0],
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Create employee record FIRST (this prevents the business creation trigger)
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert({
        business_id,
        user_id: newUser.user.id,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (employeeError) {
      console.error("Error creating employee:", employeeError);
      // If employee creation fails, delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Failed to create employee record: " + employeeError.message);
    }

    console.log("Employee created:", employee.id);

    // Create default permissions for cashier role
    if (role === "cashier") {
      const defaultPermissions = [
        { employee_id: employee.id, module: "pos", can_read: true, can_write: true },
        { employee_id: employee.id, module: "customers", can_read: true, can_write: false },
        { employee_id: employee.id, module: "cash_register", can_read: true, can_write: true },
      ];

      const { error: permsError } = await supabaseAdmin
        .from("employee_permissions")
        .insert(defaultPermissions);

      if (permsError) {
        console.error("Error creating permissions:", permsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        employee: {
          id: employee.id,
          user_id: newUser.user.id,
          email: email,
          full_name: full_name || email.split("@")[0],
          role,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-employee function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});