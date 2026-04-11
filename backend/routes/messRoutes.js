const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const messController = require('../controllers/messController');

router.get('/', messController.getAllMesses);
router.get('/provider/my-messes', auth, messController.getMyMesses);
router.get('/:id', messController.getMessById);
router.post('/', auth, messController.createMess);
router.put('/:id', auth, messController.updateMess);

module.exports = router;
