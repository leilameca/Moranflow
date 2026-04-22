const express = require('express')

const {
  createPayment,
  deletePayment,
} = require('../controllers/paymentsController')

const router = express.Router()

router.post('/project/:projectId', createPayment)
router.delete('/:id', deletePayment)

module.exports = router
