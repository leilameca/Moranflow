const express = require('express')

const {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientsController')

const router = express.Router()

router.get('/', listClients)
router.post('/', createClient)
router.put('/:id', updateClient)
router.delete('/:id', deleteClient)

module.exports = router
