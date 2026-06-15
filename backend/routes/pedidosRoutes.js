const express = require("express");
const { criarPedido } = require("../controllers/pedidosController");

const router = express.Router();

router.post("/pedidos", criarPedido);

module.exports = router;
