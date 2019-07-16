import express from 'express';
import Validation from '../../validators/articles';
import Article from '../../controllers/articles';
import Middleware from '../../middlewares';
import Comment from '../../controllers/comments';

const router = express.Router();

router.post(
  '/',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.createArticle,
  Middleware.generateReadTime,
  Article.createArticle,
);
router.post(
  '/rate/:slug',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.rateArticle,
  Article.rateArticle,
);
router.get(
  '/',
  Validation.getArticles,
  Article.getArticles,
);
router.get(
  '/:slug',
  Validation.articleSlug,
  Article.getArticle,
);
router.put(
  '/:slug',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.updateArticle,
  Middleware.generateReadTime,
  Article.updateArticle,
);
router.delete(
  '/:slug',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.articleSlug,
  Article.deleteArticle,
);

router.post('/vote/:slug', Middleware.authenticate, Middleware.isblackListedToken, Article.voteArticle);

router.get(
  '/rate/:slug',
  Validation.articleSlug,
  Article.getArticleRatings,
);

router.post(
  '/:slug/comments',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.articleSlug,
  Validation.addComment,
  Comment.addComment
);

router.get(
  '/bookmark/:slug',
  Middleware.authenticate,
  Middleware.isblackListedToken,
  Validation.articleSlug,
  Article.bookmarkArticle,
);
export default router;
