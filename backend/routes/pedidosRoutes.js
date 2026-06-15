const express = require("express");
const { criarPedido, listarPedidos } = require("../controllers/pedidosController");

const router = express.Router();

router.get("/pedidos", listarPedidos);
router.post("/pedidos", criarPedido);

module.exports = router;
