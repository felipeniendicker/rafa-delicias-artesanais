const express = require("express");
const { criarPedido, listarPedidos, atualizarStatusPedido } = require("../controllers/pedidosController");

const router = express.Router();

router.get("/pedidos", listarPedidos);
router.post("/pedidos", criarPedido);
router.patch("/pedidos/:id/status", atualizarStatusPedido);

module.exports = router;
