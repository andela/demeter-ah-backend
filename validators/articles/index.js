import { sanitize } from 'indicative';
import { messages, validatorInstance, sanitizeRules } from '../../utils';

export default {
  createArticle: async (req, res, next) => {
    const rules = {
      description: 'required|string',
      body: 'required|string',
      image: 'object',
      title: 'required|string',
      categoryId: 'required|integer',
      publish: 'required|boolean'
    };

    const data = { ...req.body, ...req.files };
    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  updateArticle: async (req, res, next) => {
    const rules = {
      description: 'string',
      body: 'string',
      image: 'object',
      title: 'string',
      publish: 'boolean',
      slug: 'string|required'
    };

    const data = { ...req.body, ...req.files, ...req.params };

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  articleSlug: async (req, res, next) => {
    const rules = {
      slug: 'string|required'
    };

    const data = { ...req.params };

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  getArticles: async (req, res, next) => {
    const rules = {
      limit: 'integer|required_with_any:offset',
      offset: 'integer',
      tag: 'string',
      sort: 'string',
      category: 'string',
    };

    const data = { ...req.query };

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  getUserArticles: async (req, res, next) => {
    const rules = {
      limit: 'integer|required_with_any:offset',
      offset: 'integer'
    };

    const data = { ...req.query };

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  rateArticle: async (req, res, next) => {
    const rule = {
      rate: 'required|integer|range:0,6',
    };
    try {
      await validatorInstance.validateAll(req.body.rate, rule, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  addComment: async (req, res, next) => {
    const rules = {
      content: 'required|string',
      slug: 'required|string',
      highlightedText: 'string'
    };
    const { params: { slug }, body } = req;
    const data = { ...body, slug };

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  commentId: async (req, res, next) => {
    const rules = {
      commentId: 'required|integer'
    };
    const { commentId } = req.params;
    try {
      await validatorInstance.validateAll({ commentId }, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },
  reportArticle: async (req, res, next) => {
    const rules = {
      message: 'required|string'
    };

    const data = req.body;

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        message: e,
      });
    }
  },

  flagArticle: async (req, res, next) => {
    try {
      JSON.parse(req.body.flag);
      const rules = {
        flag: 'required|boolean'
      };
      const data = req.body;
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        error: 'flag must be true or false',
      });
    }
  },
  voteComment: async (req, res, next) => {
    let data;
    const rules = {
      status: 'required|boolean',
      commentId: 'required|integer'
    };

    try {
      data = { status: JSON.parse(req.body.status), ...req.params };
    } catch (error) {
      return res.status(400).send({
        error: 'Wrong status field provided',
      });
    }

    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).send({
        message: e,
      });
    }
  },

  voteArticle: async (req, res, next) => {
    let voteData;
    const rules = {
      status: 'required|boolean',
      slug: 'required|string'
    };

    try {
      voteData = { status: JSON.parse(req.body.status), ...req.params };
    } catch (error) {
      return res.status(400).send({
        error: 'Wrong status field provided',
      });
    }

    try {
      await validatorInstance.validateAll(voteData, rules, messages);
      next();
    } catch (e) {
      return res.status(400).send({
        error: e,
      });
    }
  },

  category: async (req, res, next) => {
    const rules = {
      category: 'string|required'
    };

    const data = req.params;

    sanitize(data, sanitizeRules);
    try {
      await validatorInstance.validateAll(data, rules, messages);
      next();
    } catch (e) {
      return res.status(400).json({
        error: e,
      });
    }
  },
};
