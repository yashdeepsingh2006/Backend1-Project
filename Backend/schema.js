import Joi from 'joi';

export const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).max(1000000).required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        image: Joi.object({
            filename: Joi.string(),
            url: Joi.string().allow("", null),
        })
    }).required()
});

export const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().min(10).max(500).required(),
    }).required()
});