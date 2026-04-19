import express from 'express';
import {
    getAllListings,
    getAllListingsById,
    postTheListning,
    postingNewListing,
    editTheListing,
    putTheChanges,
    deleteTheListing,
    savingReview,
    deletingReview,
} from '../Controllers/listing.controller.js';
import wrapAsync from '../Middlewares/wrapAsync.js';
import validateListing from '../Middlewares/validateListing.js';
import validateReview from '../Middlewares/validateReview.js';

const router = express.Router();

router.get('/', wrapAsync(getAllListings));
router.get('/new', wrapAsync(postTheListning));
router.get('/:id', wrapAsync(getAllListingsById));
router.post('/', validateListing, wrapAsync(postingNewListing));
router.get('/:id/edit', wrapAsync(editTheListing));
router.put('/:id', validateListing, wrapAsync(putTheChanges));
router.delete('/:id', wrapAsync(deleteTheListing));
router.post('/:id/reviews', validateReview, wrapAsync(savingReview));
router.delete('/:id/reviews/:reviewId', wrapAsync(deletingReview));

export default router;  