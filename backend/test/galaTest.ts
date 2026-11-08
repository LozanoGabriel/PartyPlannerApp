import { mockEventDetails } from "../mock-data";

async function sendPostToGala() {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
        throw new Error("Set SUPABASE_ACCESS_TOKEN to a valid Supabase access token before testing Gala.");
    }

    const response = await fetch("http://127.0.0.1:3000/api/gala", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            context: "Prompt",
            userPrompt: "Hello, can you give me a set of tasks I should have before this event happens?",
            eventDetails: mockEventDetails
        })
    });

    const responseBody = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        throw new Error(
            `Expected JSON from POST /api/gala, received HTTP ${response.status} ` +
            `with Content-Type "${contentType}". Response begins: ${responseBody.slice(0, 500)}`
        );
    }

    const data: unknown = JSON.parse(responseBody);
    if (!response.ok) {
        throw new Error(`POST /api/gala failed with HTTP ${response.status}: ${responseBody}`);
    }
    console.log(data);
}

sendPostToGala().catch((error: unknown) => {
    console.error("Gala endpoint test failed:", error);
    process.exitCode = 1;
});