import { Router } from 'express';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Middleware to extract user ID from token
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

router.get('/auth-url', authMiddleware, (req: any, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    state: req.userId // pass userId to link the account later
  });
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const userId = state as string;

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await youtube.channels.list({ part: ['snippet'], mine: true });
    const channelId = channelRes.data.items?.[0]?.id;

    if (!channelId) {
      return res.status(400).json({ error: 'Could not find YouTube channel' });
    }

    // Save or update account in DB
    await prisma.youTubeAccount.upsert({
      where: { id: channelId }, // In a real app we might need a composite key or checking by userId + channelId
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiry: new Date(tokens.expiry_date!)
      },
      create: {
        userId,
        channelId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        tokenExpiry: new Date(tokens.expiry_date!)
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?youtube_connected=true`);
  } catch (error) {
    console.error('YouTube OAuth Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?youtube_connected=false`);
  }
});

export default router;
