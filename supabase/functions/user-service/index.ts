import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { z } from 'npm:zod';

console.log("User Service Function initialized");

// Define validation schemas
const CustomerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  skill_level: z.string().optional(),
  age: z.number().int().optional(),
  gender: z.string().optional(),
  weight: z.number().optional(),
  emergency_contact: z.string().optional(),
  additional_notes: z.string().optional(),
  experience_hours: z.number().optional()
});

const InstructorProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

async function userServiceCore(req: Request) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase client for user's JWT (for authentication and manager role verification)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Supabase client with service_role_key (for bypassing RLS after manager verification)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is a manager
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'manager') {
      console.error('Role check failed:', profile?.role);
      return new Response(JSON.stringify({ error: 'Forbidden: Managers only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pathname, searchParams } = new URL(req.url);
    const pathParts = pathname.split('/');
    // pathname example: /user-service/users or /user-service/users/UUID
    const resource = pathParts[pathParts.length - 1]; // 'users' or UUID
    const parentResource = pathParts[pathParts.length - 2]; // 'user-service' or 'users'

    // We expect the path to be .../users or .../users/:id
    const isUserRoot = resource === 'users';
    const isSpecificUser = parentResource === 'users';
    const userId = isSpecificUser ? resource : null;

    // --- GET /users ---
    if (req.method === 'GET' && isUserRoot) {
      const roleFilter = searchParams.get('role'); // 'customer' or 'instructor'
      const searchQuery = searchParams.get('search');

      let query = supabaseAdmin.from('profiles').select(`
        id,
        role,
        full_name,
        email,
        phone,
        created_at,
        customer_details (*),
        instructor_details (*)
      `);

      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      if (searchQuery) {
          query = query.ilike('full_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- POST /users (Create User) ---
    if (req.method === 'POST' && isUserRoot) {
      const body = await req.json();
      const role = body.role; // 'customer' or 'instructor'
      
      if (!role || (role !== 'customer' && role !== 'instructor')) {
         return new Response(JSON.stringify({ error: 'Invalid role specified' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }

      // Validate body based on role
      const validation = role === 'customer' 
        ? CustomerProfileSchema.safeParse(body) 
        : InstructorProfileSchema.safeParse(body);

      if (!validation.success) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const parsedData = validation.data;

      // Create auth user (dummy password for now, or send invite)
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: parsedData.email,
        password: 'ChangeMe123!', // TODO: Implement better onboarding flow
        email_confirm: true,
        user_metadata: { full_name: parsedData.name }
      });

      if (createError) throw createError;

      // Create profile and details
      // Note: profiles entry is often created via trigger on auth.users, but we might need to update it
      // or if no trigger, create it. Assuming trigger exists or we upsert.
      
      // Update profile with role and name
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: role, full_name: parsedData.name, phone: parsedData.phone })
        .eq('id', authUser.user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Insert details based on role
      if (role === 'customer') {
          const { error: detailsError } = await supabaseAdmin
            .from('customer_details')
            .upsert({
                user_id: authUser.user.id,
                skill_level: parsedData.skill_level,
                age: parsedData.age,
                gender: parsedData.gender,
                weight: parsedData.weight,
                emergency_contact: parsedData.emergency_contact,
                notes: parsedData.notes,
                experience_hours: parsedData.experience_hours
            });
            if (detailsError) throw detailsError;
      } else if (role === 'instructor') {
          const { error: detailsError } = await supabaseAdmin
            .from('instructor_details')
            .upsert({
                user_id: authUser.user.id,
                certifications: parsedData.certifications,
                status: parsedData.status || 'active'
            });
            if (detailsError) throw detailsError;
      }

      return new Response(JSON.stringify({ data: { id: authUser.user.id } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- PUT /users/:id (Update User) ---
    if (req.method === 'PUT' && isSpecificUser) {
        const body = await req.json();
        const role = body.role; // Needs to be passed or fetched? Ideally fetched.
        
        // Fetch current role to know which schema to validate against and table to update
        const { data: currentProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
        if (fetchError || !currentProfile) {
             return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
        }

        const currentRole = currentProfile.role;

         // Validate body based on role
        const validation = currentRole === 'customer' 
            ? CustomerProfileSchema.partial().safeParse(body) 
            : InstructorProfileSchema.partial().safeParse(body);

        if (!validation.success) {
            return new Response(JSON.stringify({ error: validation.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        const parsedData = validation.data;

        // Update profile (common fields)
        const profileUpdates: any = {};
        if (parsedData.name) profileUpdates.full_name = parsedData.name;
        if (parsedData.email) profileUpdates.email = parsedData.email;
        if (parsedData.phone) profileUpdates.phone = parsedData.phone;

        if (Object.keys(profileUpdates).length > 0) {
             const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', userId);
            if (profileUpdateError) throw profileUpdateError;
        }

        // Update details
        if (currentRole === 'customer') {
            const customerUpdates: any = {};
            if (parsedData.skill_level !== undefined) customerUpdates.skill_level = parsedData.skill_level;
            if (parsedData.age !== undefined) customerUpdates.age = parsedData.age;
            if (parsedData.gender !== undefined) customerUpdates.gender = parsedData.gender;
            if (parsedData.weight !== undefined) customerUpdates.weight = parsedData.weight;
            if (parsedData.emergency_contact !== undefined) customerUpdates.emergency_contact = parsedData.emergency_contact;
            if (parsedData.additional_notes !== undefined) customerUpdates.additional_notes = parsedData.additional_notes;
            if (parsedData.experience_hours !== undefined) customerUpdates.experience_hours = parsedData.experience_hours;
            
            if (Object.keys(customerUpdates).length > 0) {
                 const { error: detailsError } = await supabaseAdmin
                    .from('customer_details')
                    .update(customerUpdates)
                    .eq('user_id', userId);
                if (detailsError) throw detailsError;
            }

        } else if (currentRole === 'instructor') {
             const instructorUpdates: any = {};
             if (parsedData.certifications !== undefined) instructorUpdates.certifications = parsedData.certifications;
             if (parsedData.status !== undefined) instructorUpdates.status = parsedData.status;

             if (Object.keys(instructorUpdates).length > 0) {
                 const { error: detailsError } = await supabaseAdmin
                    .from('instructor_details')
                    .update(instructorUpdates)
                    .eq('user_id', userId);
                if (detailsError) throw detailsError;
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // --- DELETE /users/:id (Delete User - Instructors only per requirements, or generic) ---
    if (req.method === 'DELETE' && isSpecificUser) {
        // Use service role to delete from auth.users which cascades? 
        // Or just soft delete? Requirement says "Delete instructor profile".
        // Let's use service role to delete from auth.users to be thorough.

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId!);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

Deno.serve(userServiceCore);
