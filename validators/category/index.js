import { sanitize } from 'indicative';
import { messages, validatorInstance, sanitizeRules } from '../../utils';

export default {
  category: async (req, res, next) => {
    const rules = {
      name: 'required|string',
      description: 'required|string',
      image: 'object'
    };

    const data = { ...req.body, ...req.files };

    sanitize(data, sanitizeRules);
    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },
};
