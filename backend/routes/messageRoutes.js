import express from 'express';
const router = express.Router();

router.get('/:chatId', (req, res) => res.json({ message: 'Messages list' }));
router.post('/', (req, res) => res.json({ message: 'Send message' }));

export default router;
