import Listing from "../models/listing.model.js";

export const getAllListings = async (req, res) => { //listing all the default titles 
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.log(err);
    }
}

export const getAllListingsById = async (req, res) => { //getting all the infos of the titles
    try {
        let { id } = req.params;
        const showListing = await Listing.findById(id);
        res.render("listings/show.ejs", { showListing });
    } catch (err) {
        console.log(err);
    }
}

export const postTheListning = async (req, res) => { //getting the new listing form
    try {
        res.render("listings/new.ejs");
    } catch (err) {
        console.log(err);
    }
}

export const postingNewListing = async (req, res) => { //saving the new listing in DB
    try {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect('/listing');
    } catch (err) {
        console.log(err);
    }
}

export const editTheListing = async (req, res) => { //getting the listing for changes in the listing
    try {
        let { id } = req.params;
        const getListing = await Listing.findById(id);
        res.render('listings/edit.ejs', { getListing });
    }
    catch (err) {
        console.log(err);
    }
}

export const putTheChanges = async (req, res) => { //changing the listing that we got for changes
    try {
        let { id } = req.params;
        await Listing.findByIdAndUpdate(id, { ...req.body.getListing });
        res.redirect(`/listing/${id}`);
    } catch (err) {
        console.log(err);
    }
}

export const deleteTheListing = async (req, res) => { //deleting the existed listing
    try {
        let { id } = req.params;
        const deletedListing = await Listing.findByIdAndDelete(id);
        console.log(deletedListing);
        res.redirect('/listing');
    } catch (err) {
        console.log(err);
    }
}