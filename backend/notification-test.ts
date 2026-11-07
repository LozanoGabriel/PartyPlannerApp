import { applicationDefault, initializeApp } from 'firebase-admin/app';
import dotenv from "dotenv"
dotenv.config()
initializeApp({
    credential: applicationDefault(),
    databaseURL: process.env.DATABASE_URL
}
)