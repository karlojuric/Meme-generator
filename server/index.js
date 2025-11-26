import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { id, init } from '@instantdb/admin';

dotenv.config();

const { INSTANT_APP_ID, INSTANT_ADMIN_TOKEN, PORT = 4000 } = process.env;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let adminDb = null;
if (INSTANT_APP_ID && INSTANT_ADMIN_TOKEN) {
  adminDb = init({
    appId: INSTANT_APP_ID,
    adminToken: INSTANT_ADMIN_TOKEN,
  });
} else {
  console.warn(
    '[server] Missing INSTANT_APP_ID or INSTANT_ADMIN_TOKEN - admin endpoints disabled.',
  );
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    instantReady: Boolean(adminDb),
  });
});

app.post('/api/memes', async (req, res) => {
  if (!adminDb) {
    return res.status(503).json({ error: 'InstantDB admin client not ready' });
  }

  const {
    title,
    description,
    imagePath,
    imageUrl,
    authorId,
    authorEmail,
    canvasState,
  } = req.body || {};

  if (!imagePath || !authorId || !canvasState) {
    return res.status(400).json({
      error: 'imagePath, authorId and canvasState are required',
    });
  }

  try {
    const memeId = id();
    await adminDb.transact([
      adminDb.tx.memes[memeId].update({
        title,
        description,
        imagePath,
        imageUrl,
        canvasState,
        authorId,
        authorEmail,
        upvoteCount: 0,
        createdAt: Date.now(),
      }),
    ]);
    res.json({ id: memeId });
  } catch (error) {
    console.error('Unable to create meme', error);
    res
      .status(500)
      .json({ error: error?.message || 'Unknown server-side error' });
  }
});

app.post('/api/memes/:id/upvote', async (req, res) => {
  if (!adminDb) {
    return res.status(503).json({ error: 'InstantDB admin client not ready' });
  }
  const memeId = req.params.id;
  const { voterId } = req.body || {};

  if (!voterId) {
    return res.status(400).json({ error: 'voterId is required' });
  }

  try {
    const existing = await adminDb.query({
      votes: {
        $: {
          where: { memeId, userId: voterId },
          limit: 1,
        },
      },
    });

    if (existing?.data?.votes?.length) {
      return res.status(409).json({ error: 'Already upvoted' });
    }

    const voteId = id();
    const memeRecord = await adminDb.query({
      memes: { $: { where: { id: memeId }, limit: 1 } },
    });
    const currentCount = memeRecord?.data?.memes?.[0]?.upvoteCount || 0;

    await adminDb.transact([
      adminDb.tx.votes[voteId].update({
        memeId,
        userId: voterId,
        createdAt: Date.now(),
      }),
      adminDb.tx.memes[memeId].update({
        upvoteCount: currentCount + 1,
      }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error('Unable to register upvote', error);
    res
      .status(500)
      .json({ error: error?.message || 'Unknown server-side error' });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


