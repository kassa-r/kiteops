import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { findAvailableInstructors } from "../index.ts";

function createMockClient(mocks: any) {
    return {
        from: (table: string) => {
            return {
                select: (cols: string) => {
                    if (table === "instructor_lesson_types") {
                        return {
                            eq: (col: string, val: any) => {
                                if (col === "lesson_id" && val === mocks.lessonId) {
                                    return { data: mocks.qualifiedData, error: null };
                                }
                                return { data: [], error: null };
                            }
                        }
                    }
                    
                    if (table === "bookings") {
                        // Mock the chain: .in().in().lt().gt()
                        const chain = {
                            in: () => chain,
                            lt: () => chain,
                            gt: () => {
                                return { data: mocks.busyData || [], error: null };
                            }
                        };
                        return chain;
                    }
                    
                    if (table === "availability") {
                        // Mock the chain: .in().lte().gte()
                        const chain = {
                            in: () => chain,
                            lte: () => chain,
                            gte: () => {
                                return { data: mocks.availableData || [], error: null };
                            }
                        };
                        return chain;
                    }
                }
            }
        }
    }
}

Deno.test("Integration Logic - Filter Instructors", async () => {
    const lessonTypeId = 1;
    const startTime = new Date("2025-12-10T10:00:00Z");
    const endTime = new Date("2025-12-10T12:00:00Z");
    
    // Scenario:
    // Instructor A: Qualified, Available, Not Busy -> Should be returned
    // Instructor B: Qualified, Available, BUSY -> Should be excluded
    // Instructor C: Qualified, NOT Available -> Should be excluded
    
    const mocks = {
        lessonId: 1,
        qualifiedData: [
            { instructor_id: "A" },
            { instructor_id: "B" },
            { instructor_id: "C" }
        ],
        busyData: [
            { instructor_id: "B" } // B is busy
        ],
        availableData: [
            { instructor_id: "A" },
            { instructor_id: "B" } // C is not here
        ]
    };
    
    const mockClient = createMockClient(mocks);
    
    const result = await findAvailableInstructors(mockClient, lessonTypeId, startTime, endTime);
    
    assertEquals(result.length, 1);
    assertEquals(result[0], "A");
});

Deno.test("Integration Logic - No Qualified Instructors", async () => {
     const mocks = {
        lessonId: 1,
        qualifiedData: [],
        busyData: [],
        availableData: []
    };
    const mockClient = createMockClient(mocks);
    const result = await findAvailableInstructors(mockClient, 1, new Date(), new Date());
    assertEquals(result.length, 0);
});
