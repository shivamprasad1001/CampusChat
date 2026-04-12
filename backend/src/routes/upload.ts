import express, { type Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'User not authenticated' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log(`[Upload] Uploading file: ${fileName} for user ${user.id}`);

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('[Upload] Supabase storage error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(data.path);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('[Upload] Internal catch error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error occurred during upload' });
  }
});

export default router;
