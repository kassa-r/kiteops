import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { bookingServiceCore } from "../index.ts";

// Mock Factory
const createMockClient = (options: any = {}) => {
    const { user, profile, conflicts, currentBooking, onInvoke } = options;

    const mockUser = user !== undefined ? user : { id: 'user-123' };
    const mockProfile = profile !== undefined ? profile : { role: 'manager' };

    return {
        auth: {
            getUser: () => Promise.resolve({ data: { user: mockUser }, error: mockUser ? null : { message: "No user" } })
        },
        from: (table: string) => {
            if (table === 'profiles') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: mockProfile, error: null })
                        })
                    })
                };
            }
            if (table === 'bookings') {
                return {
                    select: (cols: string) => {
                        // Conflict Check Chain: .select('id').eq('instructor_id', ...).neq(...).or(...)
                        // Single Fetch Chain: .select('*').eq('id', ...).single()
                        
                        return {
                            eq: (col: string, val: any) => {
                                if (col === 'instructor_id') {
                                    return {
                                        neq: () => ({
                                            or: () => Promise.resolve({ data: conflicts ? [{ id: 999 }] : [], error: null })
                                        })
                                    };
                                }
                                if (col === 'id') {
                                    return {
                                        single: () => Promise.resolve({ data: currentBooking || { id: val, instructor_id: 'inst-1', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z' }, error: null })
                                    };
                                }
                                return {};
                            }
                        };
                    },
                    insert: (data: any) => ({
                        select: () => ({
                            single: () => Promise.resolve({ data: { ...data, id: 123, status: 'confirmed' }, error: null })
                        })
                    }),
                    update: (data: any) => ({
                        eq: (col: string, val: any) => ({
                            select: () => ({
                                single: () => Promise.resolve({ data: { ...data, id: val, status: 'confirmed' }, error: null })
                            })
                        })
                    })
                };
            }
            return {};
        },
        functions: {
            invoke: (name: string, args: any) => {
                if (onInvoke) onInvoke(name, args);
                return Promise.resolve({ data: {}, error: null });
            }
        }
    };
};

// Tests

Deno.test("POST: Creates booking successfully", async () => {
    let notificationCalled = false;
    const client = createMockClient({
        onInvoke: (name: string) => {
            if (name === 'notification-service') notificationCalled = true;
        }
    });

    const body = {
        customer_id: "00000000-0000-0000-0000-000000000001",
        instructor_id: "00000000-0000-0000-0000-000000000002",
        lesson_id: 1,
        start_time: "2025-01-01T10:00:00.000Z",
        end_time: "2025-01-01T11:00:00.000Z"
    };

    const req = new Request("http://localhost/booking", {
        method: "POST",
        body: JSON.stringify(body)
    });

    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 201);
    
    const data = await res.json();
    assertEquals(data.warning, null); // No conflict
    assertEquals(notificationCalled, true);
});

Deno.test("POST: Returns warning on conflict", async () => {
    const client = createMockClient({ conflicts: true });

    const body = {
        customer_id: "00000000-0000-0000-0000-000000000001",
        instructor_id: "00000000-0000-0000-0000-000000000002",
        lesson_id: 1,
        start_time: "2025-01-01T10:00:00.000Z",
        end_time: "2025-01-01T11:00:00.000Z"
    };

    const req = new Request("http://localhost/booking", {
        method: "POST",
        body: JSON.stringify(body)
    });

    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 201); // Still succeeds
    
    const data = await res.json();
    assertExists(data.warning); // Warning present
});

Deno.test("PUT: Updates booking successfully", async () => {
    let notificationCalled = false;
    const client = createMockClient({
        onInvoke: (name: string) => {
            if (name === 'notification-service') notificationCalled = true;
        }
    });

    const body = {
        id: 123,
        start_time: "2025-01-01T12:00:00.000Z"
    };

    const req = new Request("http://localhost/booking", {
        method: "PUT",
        body: JSON.stringify(body)
    });

    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 200);
    assertEquals(notificationCalled, true);
});

Deno.test("PUT: Returns warning on conflict", async () => {
    const client = createMockClient({ conflicts: true });

    const body = {
        id: 123,
        start_time: "2025-01-01T12:00:00.000Z"
    };

    const req = new Request("http://localhost/booking", {
        method: "PUT",
        body: JSON.stringify(body)
    });

    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 200);
    
    const data = await res.json();
    assertExists(data.warning);
});

Deno.test("Role Check: Rejects non-manager", async () => {
    const client = createMockClient({ profile: { role: 'customer' } });

    const req = new Request("http://localhost/booking", { method: "POST" }); // Method doesn't matter much here but needs to pass initial checks if any
    
    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 403);
});

Deno.test("Auth Check: Rejects no user", async () => {
    const client = createMockClient({ user: null });

    const req = new Request("http://localhost/booking", { method: "POST" });
    
    // The core function throws "Unauthorized" which is caught and returned as 400 in the catch block
    const res = await bookingServiceCore(req, client);
    assertEquals(res.status, 400);
});