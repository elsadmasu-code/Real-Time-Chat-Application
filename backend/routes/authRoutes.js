import express from 'express';
const router = express.Router();

router.post('/login', (req, res) => res.json({ message: 'Login' }));
router.post('/register', (req, res) => res.json({ message: 'Register' }));

export default router;
