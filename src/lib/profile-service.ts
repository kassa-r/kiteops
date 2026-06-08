import { createClient } from '@/lib/supabase/client';

export type UserRole = 'customer' | 'instructor' | 'manager';

export type CustomerProfile = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer';
  skill_level?: string;
  age?: number;
  gender?: string;
  weight?: number;
  emergency_contact?: string;
  additional_notes?: string;
  experience_hours?: number;
  created_at?: string;
};

export type InstructorProfile = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'instructor';
  certifications?: string[] | null;
  status?: 'active' | 'inactive';
  created_at?: string;
};

export type UserProfile = CustomerProfile | InstructorProfile;

export const ProfileService = {
  /**
   * Fetch all users, optionally filtered by role and search query.
   */
  async getUsers(role?: UserRole, search?: string): Promise<UserProfile[]> {
    const supabase = createClient();
    const queryParams = new URLSearchParams();
    if (role) queryParams.append('role', role);
    if (search) queryParams.append('search', search);

    const { data, error } = await supabase.functions.invoke(`user-service/users?${queryParams.toString()}`, {
      method: 'GET',
    });

    if (error) {
      throw new Error(error.message);
    }
    // Transform data to match UserProfile interface
    return data.data.map((user: any) => { // Access data.data here
        const base = {
            id: user.id,
            name: user.full_name,
            email: user.email,
            phone: user.phone, // Phone is now directly on the base profile
            created_at: user.created_at,
        };

        if (user.role === 'customer') {
            const customerDetails = Array.isArray(user.customer_details)
              ? user.customer_details[0]
              : user.customer_details;
            return {
                ...base,
                role: 'customer',
                skill_level: customerDetails?.skill_level,
                age: customerDetails?.age,
                gender: customerDetails?.gender,
                weight: customerDetails?.weight,
                emergency_contact: customerDetails?.emergency_contact,
                additional_notes: customerDetails?.additional_notes,
                experience_hours: customerDetails?.experience_hours,
            } as CustomerProfile;
        } else if (user.role === 'instructor') {
            const instructorDetails = Array.isArray(user.instructor_details)
              ? user.instructor_details[0]
              : user.instructor_details;
            return {
                ...base,
                role: 'instructor',
                certifications: instructorDetails?.certifications || [],
                status: instructorDetails?.status || 'active',
            } as InstructorProfile;
        }
        // Fallback for roles that are neither customer nor instructor, or incomplete data
        return base as UserProfile;
    });
  },

  /**
   * Fetch a single user profile by ID.
   * Leverages the getUsers endpoint with internal filtering or direct DB access via Edge Function
   * For now, we can reuse getProfile but point it to Edge Function or keep direct DB if RLS allows.
   * Given the requirement to use Edge Functions for user management, let's fetch via the list endpoint or specific ID.
   * The Edge Function supports /users/:id but we haven't implemented GET /users/:id specifically, 
   * only PUT and DELETE. Let's add GET /users/:id support to Edge Function or use DB directly if safe.
   * Actually, the requirements say "All backend logic... within Supabase Edge Functions".
   * So we should preferably use the Edge Function.
   * However, for "View details", reusing existing getProfile (direct DB) is faster if RLS permits.
   * But wait, RLS denies access to `customer_details` for non-managers? 
   * Let's stick to the Edge Function for manager operations.
   * For now, I'll keep the direct DB access for getProfile as a fallback or for self-profile, 
   * but for manager viewing others, we might need the Edge Function if RLS is strict.
   * 
   * Let's implementing createUser, updateUser, deleteUser via Edge Function.
   */

  async createUser(user: Partial<UserProfile> & { role: UserRole }): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('user-service/users', {
      method: 'POST',
      body: user,
    });

    if (error) throw new Error(error.message);
    return data.id;
  },

  async updateUser(userId: string, user: Partial<UserProfile>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.functions.invoke(`user-service/users/${userId}`, {
      method: 'PUT',
      body: user,
    });

    if (error) throw new Error(error.message);
  },

  async deleteUser(userId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.functions.invoke(`user-service/users/${userId}`, {
      method: 'DELETE',
    });

    if (error) throw new Error(error.message);
  },

  // Legacy/Direct DB method - likely used by Instructor Dashboard for own profile
  async getProfile(userId: string): Promise<InstructorProfile | null> {
    const supabase = createClient();
    
    // Fetch profile and details
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, phone, role')
        .eq('id', userId)
        .single();
    
    if (profileError) return null;
    
    if (profile.role === 'instructor') {
         const { data: details, error: detailsError } = await supabase
            .from('instructor_details')
            .select('certifications, status')
            .eq('user_id', userId)
            .single();
        
        if (detailsError && detailsError.code !== 'PGRST116') throw new Error(detailsError.message);

        return {
            id: userId,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            role: 'instructor',
            certifications: details?.certifications || [],
            status: details?.status || 'active'
        };
    }
    
    return null; 
  },
};
