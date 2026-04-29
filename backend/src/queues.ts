import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const downloadQueue = new Queue('download_queue', { connection });
export const transcriptionQueue = new Queue('transcription_queue', { connection });
export const aiAnalysisQueue = new Queue('ai_analysis_queue', { connection });
export const clippingQueue = new Queue('clipping_queue', { connection });
export const uploadQueue = new Queue('upload_queue', { connection });
