const express = require('express');

const router = express.Router()

const pick = require('../utils/pick')

router
  .get('/', (req, res) => {
    return res.render('products', {
      title: 'All products',
    })
  })
  .post('/', (req, res) => {
    let productObj = pick(req.body, ['name', 'price', 'quantity'])
    if (productObj) {
      console.log(productObj)
      return res.status(200).json(productObj)
    } else {
      console.log('Nothing')
      return res.status(500).json({ msg: 'error' })
    }
  })

module.exports = router