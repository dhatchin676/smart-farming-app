// backend/middleware/validate.js
const Joi = require('joi');

// Soil recommendation validator
const soilSchema = Joi.object({
  soil_type:  Joi.string().valid('clay','sandy','loam','silt','black','red').required(),
  ph:         Joi.number().min(0).max(14).required(),
  season:     Joi.string().valid('Kharif','Rabi','Zaid').optional(),
  irrigation: Joi.string().optional(),
  area:       Joi.number().optional()
});

// Harvest predict validator
const harvestSchema = Joi.object({
  crop:       Joi.string().required(),
  sow_date:   Joi.string().isoDate().required(),
  area:       Joi.number().optional(),
  irrigation: Joi.string().optional(),
  variety:    Joi.string().optional()
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
}

module.exports = { validate, soilSchema, harvestSchema };