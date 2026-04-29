import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const worker = new Worker('download_queue', async job => {
  const { videoId, sourceUrl, userId } = job.data;
  console.log(`[Worker] Downloading video: ${sourceUrl}`);

  try {
    // 1. Download video using yt-dlp
    // In a real scenario, we stream to S3 or download to a fast local volume.
    const outputPath = `/tmp/${videoId}.mp4`;
    await execPromise(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" ${sourceUrl}`);
    
    console.log(`[Worker] Download complete: ${outputPath}`);

    // 2. Upload to S3
    // const s3Key = await uploadToS3(outputPath);

    // 3. Extract Audio for Transcription
    // await extractAudio(outputPath);

    // 4. Push to Transcription Queue
    // await transcriptionQueue.add('transcribe', { videoId, s3Key });

  } catch (error) {
    console.error(`[Worker] Failed to process ${videoId}`, error);
    throw error;
  }
}, { connection, concurrency: 5 }); // Process up to 5 downloads at once

worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with error ${err.message}`);
});
