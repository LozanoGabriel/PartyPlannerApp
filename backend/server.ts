import 'dotenv/config';
import express from "express"
import cors from "cors"

// The Supabase client is created in lib/supabase.ts and re-exported here, so every
// existing `import { supabase } from "../server"` keeps working.
// Keep this line ABOVE the route imports so the client exists before any route file loads.
export { supabase } from "./lib/supabase"

import eventRoutes from "./routes/event"
import guestRoutes from "./routes/guests"
import invitationSettingsRoutes from "./routes/invitation-settings"
import taskRoutes from "./routes/tasks"
import rsvpRoutes from "./routes/event-rvsp-forum"
import galaRoutes from "./routes/gala"

const app = express();
app.use(cors());           // allows any origin: fine for the hackathon, can be limited to FRONTEND_URL later
app.use(express.json());   // must come BEFORE the routes, or req.body is undefined

app.get('/', (req, res) => res.json({ status: 'ok' }));

// Every router gets its OWN prefix. Never mount a router at "/api" itself: a router that
// calls router.use(requireAuth) would answer 401 to requests meant for other routers.
app.use("/api/events", eventRoutes);                          // host only
app.use("/api/guests", guestRoutes);                          // host only
app.use("/api/invitation-settings", invitationSettingsRoutes); // host only
app.use("/api/tasks", taskRoutes);                            // host only
app.use("/api/rsvp", rsvpRoutes);                             // PUBLIC: guests answering an invitation (the token is the credential)
// app.use("/api/gala", galaRoutes);

// After all the routes: JSON errors instead of HTML error pages
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON" });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
});

// Last, so everything above is ready before the first request arrives
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));

