import express from 'express';
import { getFolders, createFolder, updateFolder, deleteFolder } from '../controllers/folder.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFolders)
  .post(createFolder);

router.route('/:id')
  .put(updateFolder)
  .delete(deleteFolder);

export default router;
