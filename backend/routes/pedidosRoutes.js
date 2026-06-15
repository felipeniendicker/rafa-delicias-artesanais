const express = require("express");
const { criarPedido, listarPedidos, atualizarStatusPedido } = require("../controllers/pedidosController");
const { autenticarAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/pedidos", autenticarAdmin, listarPedidos);
router.post("/pedidos", criarPedido);
router.patch("/pedidos/:id/status", autenticarAdmin, atualizarStatusPedido);

module.exports = router;
