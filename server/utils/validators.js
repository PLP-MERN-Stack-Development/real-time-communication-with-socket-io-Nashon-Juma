import Joi from 'joi';

export const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

export const validateChannel = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(200).allow(''),
    type: Joi.string().valid('public', 'private', 'direct').default('public'),
  });

  return schema.validate(data);
};

export const validateMessage = (data) => {
  const schema = Joi.object({
    content: Joi.string().max(5001).allow(''),
    replyTo: Joi.string().allow(''),
  });

  return schema.validate(data);
};