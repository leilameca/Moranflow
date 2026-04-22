const express = require('express')

const {
  listServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/servicesController')

const router = express.Router()

router.get('/', listServices)
router.post('/', createService)
router.put('/:id', updateService)
router.delete('/:id', deleteService)

module.exports = router
