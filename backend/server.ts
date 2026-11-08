import 'dotenv/config';
import {createClient} from '@supabase/supabase-js'
import express from "express"
import cors from "cors"
import eventRoutes from "./routes/event"
import eventDetailRoutes from "./routes/event-rvsp-forum"
import galaRoutes from "./routes/gala"

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use("/api/events", eventRoutes);
app.use("/api/", eventDetailRoutes);
app.use("/api/gala", galaRoutes);

// Creating client on Supabase
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!url || !key){
    throw new Error('Missing url or key in .env')
}

export const supabase = createClient(url,key)

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));
