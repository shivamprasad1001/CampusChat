import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(data.path);
        res.json({ url: publicUrl });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
export default router;
//# sourceMappingURL=upload.js.map