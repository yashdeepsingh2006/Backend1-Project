import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Booking from '../models/booking.model.js';
import passport from 'passport';
import { sendOTPEmail } from '../utils/mailer.js';
import { cloudinary } from '../utils/cloudinary.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const getRegisterForm = async (req, res) => {
    res.render('users/register.ejs');
};

export const registerUser = async (req, res, next) => {
    try {
        const { username, email, firstName, lastName, password } = req.body.user;
        console.log(`[register] incoming request for ${username} <${email}>`);

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log(`[register] blocked duplicate user for ${username} <${email}>`);
            req.flash("error", existingUser.email === email ? "Email already registered!" : "Username already taken!");
            return res.redirect('/register');
        }

        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000;

        req.session.pendingUser = { username, email, firstName, lastName, password };
        req.session.otp = otp;
        req.session.otpExpiry = otpExpiry;

        const emailSent = await sendOTPEmail(email, otp, firstName);
        console.log(`[register] otp prepared for ${username} <${email}>; emailSent=${emailSent}`);

        req.flash("success", emailSent
            ? `OTP sent to ${email}. Please verify your account.`
            : `OTP could not be emailed right now. Check server logs for the OTP, then verify your account.`);
        res.redirect('/verify-otp');

    } catch (err) {
        console.error('[register] failed:', err);
        req.flash("error", err.message);
        res.redirect('/register');
    }
};

export const getOTPForm = async (req, res) => {
    if (!req.session.pendingUser) {
        req.flash("error", "Please register first.");
        return res.redirect('/register');
    }
    res.render('users/verify-otp.ejs');
};

export const verifyOTP = async (req, res, next) => {
    try {
        const { otp } = req.body;
        console.log('[verify-otp] attempt received');

        if (!req.session.pendingUser) {
            console.warn('[verify-otp] no pending user in session');
            req.flash("error", "Session expired. Please register again.");
            return res.redirect('/register');
        }

        if (Date.now() > req.session.otpExpiry) {
            delete req.session.pendingUser;
            delete req.session.otp;
            delete req.session.otpExpiry;
            req.flash("error", "OTP has expired. Please register again.");
            return res.redirect('/register');
        }

        if (otp !== req.session.otp) {
            console.warn('[verify-otp] invalid otp submitted');
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect('/verify-otp');
        }

        const { username, email, firstName, lastName, password } = req.session.pendingUser;

        const newUser = new User({ username, email, firstName, lastName, isVerified: true });
        const registeredUser = await User.register(newUser, password);
        console.log(`[verify-otp] user registered: ${registeredUser.username} <${registeredUser.email}>`);

        delete req.session.pendingUser;
        delete req.session.otp;
        delete req.session.otpExpiry;

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to Hotspot, ${registeredUser.firstName}!`);
            const redirectUrl = res.locals.redirectUrl || '/listing';
            delete req.session.redirectUrl;
            res.redirect(redirectUrl);
        });

    } catch (err) {
        console.error('[verify-otp] failed:', err);
        req.flash("error", err.message);
        res.redirect('/verify-otp');
    }
};

export const resendOTP = async (req, res) => {
    try {
        if (!req.session.pendingUser) {
            req.flash("error", "Session expired. Please register again.");
            return res.redirect('/register');
        }

        const otp = generateOTP();
        req.session.otp = otp;
        req.session.otpExpiry = Date.now() + 10 * 60 * 1000;

        const emailSent = await sendOTPEmail(req.session.pendingUser.email, otp, req.session.pendingUser.firstName);
        console.log(`[resend-otp] emailSent=${emailSent} for ${req.session.pendingUser.username}`);

        req.flash("success", emailSent ? "New OTP sent successfully!" : "OTP could not be emailed right now. Check server logs for the OTP.");
        res.redirect('/verify-otp');

    } catch (err) {
        console.error('[resend-otp] failed:', err);
        req.flash("error", "Failed to resend OTP. Please try again.");
        res.redirect('/verify-otp');
    }
};

export const getLoginForm = async (req, res) => {
    res.render('users/login.ejs');
};

export const loginUser = async (req, res) => {
    req.flash("success", `Welcome back, ${req.user.firstName}!`);
    const redirectUrl = res.locals.redirectUrl || '/listing';
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

export const logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect('/listing');
    });
};

export const getProfile = async (req, res, next) => {
    const recentlyViewedIds = req.session.recentlyViewed || [];
    const recentlyViewed = await Listing.find({ '_id': { $in: recentlyViewedIds } });

    const bookings = await Booking.find({ user: req.user._id })
        .populate('listing')
        .sort({ createdAt: -1 });

    const orderedListings = recentlyViewedIds
        .map(id => recentlyViewed.find(l => l._id.toString() === id))
        .filter(Boolean);

    res.render('users/profile.ejs', {
        user: req.user,
        recentlyViewed: orderedListings,
        bookings,
    });
};

export const uploadProfilePic = async (req, res, next) => {
    try {
        console.log('profile upload request from user:', req.user && req.user._id);
        console.log('uploaded file:', req.file);
        if (!req.file) {
            req.flash('error', 'No file uploaded');
            return res.redirect('/profile');
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/profile');
        }

        // delete previous image from cloudinary
        if (user.profileImage && user.profileImage.filename) {
            try { await cloudinary.uploader.destroy(user.profileImage.filename); } catch (e) { }
        }

        user.profileImage = { url: req.file.path, filename: req.file.filename };
        await user.save();

        req.login(user, (err) => {
            if (err) {
                console.error('req.login error after profile update:', err);
                req.flash('error', 'Failed to refresh session after upload');
            } else {
                req.flash('success', 'Profile picture updated successfully');
            }
            return res.redirect('/profile');
        });
    } catch (err) {
        console.error('Error in uploadProfilePic:', err);
        next(err);
    }
};