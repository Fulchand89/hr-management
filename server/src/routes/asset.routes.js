const express = require('express');
const router = express.Router();

const assetController = require('../controllers/asset.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.HR));

router.get('/', assetController.getAllAssets);
router.post('/', assetController.createAsset);
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
