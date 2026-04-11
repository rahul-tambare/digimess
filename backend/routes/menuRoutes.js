const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const menuController = require('../controllers/menuController');

// All routes here might require either customer or vendor auth depending on use case.
// For vendor operations:
router.post('/', auth, menuController.addMenuItem);
router.put('/:id', auth, menuController.updateMenuItem);
router.delete('/:id', auth, menuController.deleteMenuItem);

// For getting menu: Can optionally use a middleware to check role inside controller
// To allow unauthenticated customers or authenticated ones, we can just call it (auth middleware normally rejects if no token).
// If we want public access, we create a public route. Let's assume auth is optional or required. We will use auth for now.
router.get('/mess/:messId', auth, menuController.getMessMenu);

module.exports = router;
