import express from 'express';
import cors from 'cors'
import { scheduleJob } from 'node-schedule'
import { router } from './routes';
import { verifyOccurrencesExpiration } from './scheduledJobs';
import 'reflect-metadata'
import 'express-async-errors'

const app = express();
app.use(cors())
app.use(express.json())
app.use(router);

scheduleJob('0 1 * * *', verifyOccurrencesExpiration)

export { app }