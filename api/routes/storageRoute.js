const express = require('express')
const router = express.Router()
const controller = require('../controllers/storageController')
const checkAPIKEY = require('../middleware/checkAPIKEY')

router.get('/image', checkAPIKEY, controller.image_get)
router.post('/image', checkAPIKEY, controller.image_post)
router.delete('/image', checkAPIKEY, controller.image_delete)

module.exports = router