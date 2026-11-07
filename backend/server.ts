import express from "express"
import cors from "cors"
import eventDetailRoutes from "./routes/event-details-routes"

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));

app.use("/api/", eventDetailRoutes);
