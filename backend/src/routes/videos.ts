import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { downloadQueue } from '../queues';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/ingest', authMiddleware, async (req: any, res) => {
  try {
    const { sourceUrl } = req.body;
    const userId = req.userId;

    const video = await prisma.video.create({
      data: {
        userId,
        sourceUrl,
        status: 'PENDING'
      }
    });

    // Add to download queue
    await downloadQueue.add('download_video', {
      videoId: video.id,
      sourceUrl,
      userId
    });

    res.json({ message: 'Video queued for processing', video });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to ingest video' });
  }
});

router.get('/', authMiddleware, async (req: any, res) => {
  const videos = await prisma.video.findMany({
    where: { userId: req.userId },
    include: { clips: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(videos);
});

export default router;
