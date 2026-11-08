import 'dotenv/config';
import {createClient} from '@supabase/supabase-js'
import express from "express"
import cors from "cors"
import eventDetailRoutes from "./routes/event-details-routes"
import rsvp from "./routes/event-rsvp-forum"

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));

app.use("/api/", eventDetailRoutes);
app.use("${FRONTEND_URL}/rsvp", rsvp);

// Creating client on Supabase
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!url || !key){
    throw new Error('Missing url or key in .env')
}

export const supabase = createClient(url,key)

