import express from 'express';
import { z } from 'zod';
import { createUser, deleteUser, updateUser } from './users';

export const router = express.Router();

const deleteSchema = z.object({ id: z.string().uuid() });

router.post('/user', (req, res) => {
  try {
    const user = createUser(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/user', (req, res) => {
  try {
    const user = updateUser(req.body);
    res.status(200).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/user', (req, res) => {
  try {
    const parsed = deleteSchema.parse(req.body);
    deleteUser(parsed.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

