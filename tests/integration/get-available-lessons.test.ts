import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handleRequest } from "../../supabase/functions/get-available-lessons/index.ts";

// Mock environment variables if needed, or rely on system env.
// For Deno test, we can set them in the process if we want to mock.

Deno.test("get-available-lessons - Returns 400 if date is missing", async () => {
  const req = new Request("http://localhost/get-available-lessons", {
    method: "GET",
  });
  const res = await handleRequest(req);
  assertEquals(res.status, 400);
});

Deno.test("get-available-lessons - Returns 400 if date format is invalid", async () => {
  const req = new Request("http://localhost/get-available-lessons?date=12-25-2025", {
    method: "GET",
  });
  const res = await handleRequest(req);
  assertEquals(res.status, 400);
});
