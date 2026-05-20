import Listing from '../models/listing.model.js';

const isNotListingOwner = async (req, res, next) => {
    if (!req.user) {
        return next();
    }

    const { id } = req.params;
    const listing = await Listing.findById(id).select('owner');

    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listing');
    }

    if (listing.owner && listing.owner.toString() === req.user._id.toString()) {
        req.flash('error', 'You cannot book or review your own listing.');
        return res.redirect(`/listing/${id}`);
    }

    next();
};

export default isNotListingOwner;