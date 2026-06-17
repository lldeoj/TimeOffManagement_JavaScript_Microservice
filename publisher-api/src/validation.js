// Validation schemas for Time-Off requests
import Joi from 'joi';

export const timeOffRequestSchema = Joi.object({
  employee_id: Joi.string().required().messages({
    'string.empty': 'Employee ID is required'
  }),
  start_date: Joi.date().iso().required().messages({
    'date.base': 'Start date must be a valid ISO date',
    'any.required': 'Start date is required'
  }),
  end_date: Joi.date().iso().required().messages({
    'date.base': 'End date must be a valid ISO date',
    'any.required': 'End date is required'
  }),
  reason: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Reason must have at least 5 characters',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required'
  }),
  type: Joi.string().valid('vacation', 'sick_leave', 'personal', 'unpaid').required().messages({
    'any.only': 'Type must be one of: vacation, sick_leave, personal, unpaid',
    'any.required': 'Type is required'
  })
});

export const updateTimeOffRequestSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'pending').messages({
    'any.only': 'Status must be one of: approved, rejected, pending'
  }),
  notes: Joi.string().max(500)
}).min(1);

export async function validateRequest(data, schema) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new Error(JSON.stringify(messages));
  }
  return value;
}
