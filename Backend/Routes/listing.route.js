import express from 'express';
import { getAllListings, getAllListingsById, postTheListning, postingNewListing, editTheListing, putTheChanges, deleteTheListing } from '../Controllers/listing.controller.js';

const router = express.Router();
router.get('/', getAllListings);
router.get('/new', postTheListning);
router.get('/:id', getAllListingsById);
router.post('/', postingNewListing);
router.get('/:id/edit', editTheListing);
router.put('/:id', putTheChanges);
router.delete('/:id', deleteTheListing);

export default router;