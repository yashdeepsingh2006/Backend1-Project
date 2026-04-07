import Listing from "../models/listing.model.js";
import ExpressError from "../Middlewares/ExpressError.js";

export const getAllListings = async (req, res) => { //listing all the default titles 
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}

export const getAllListingsById = async (req, res, next) => { //getting all the infos of the titles
    let { id } = req.params;
    const showListing = await Listing.findById(id);

    if (!showListing) {
        return next(new ExpressError(404, "Listing not found!"));
    }

    res.render("listings/show.ejs", { showListing });
}

export const postTheListning = async (req, res) => { //getting the new listing form
    res.render("listings/new.ejs");
}

export const postingNewListing = async (req, res, next) => { //saving the new listing in DB
    if (!req.body.listing) {
        return next(new ExpressError(400, "Invalid listing data!"));
    }

    const newListing = new Listing(req.body.listing);
    await newListing.save();

    res.redirect('/listing');
}

export const editTheListing = async (req, res, next) => { //getting the listing for changes in the listing
    let { id } = req.params;
    const getListing = await Listing.findById(id);

    if (!getListing) {
        return next(new ExpressError(404, "Listing not found!"));
    }

    res.render('listings/edit.ejs', { getListing });
}

export const putTheChanges = async (req, res, next) => { //changing the listing that we got for changes
    let { id } = req.params;

    if (!req.body.listing) {
        return next(new ExpressError(400, "Invalid listing data!"));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true, runValidators: true }
    );

    if (!updatedListing) {
        return next(new ExpressError(404, "Listing not found!"));
    }

    res.redirect(`/listing/${id}`);
}

export const deleteTheListing = async (req, res, next) => { //deleting the existed listing
    let { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        return next(new ExpressError(404, "Listing not found!"));
    }

    res.redirect('/listing');
}