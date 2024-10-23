const express = require('express');
const router = express.Router();
const Concept = require('../models/concept');

//============================================
// REGISTRAR CONCEPTO POR SOLICITUD DE DINERO
//============================================
router.post('/concept', (req, res) => {
    const body = req.body;

    Concept.create({
        descripcion: body.descripcion,
        /* area_id: body.area_id */
    }).then((resp) => {
        res.json({
            ok: true,
            resp
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
});

//=============================
// OBTENER TODOS LOS CONCEPTOS
//=============================
router.get('/concepts', (req, res) => {
    Concept.find({})
        .exec()
        .then((resp) => {
            if (resp.length === 0) {
                return res.status(400).json({
                    ok: false,
                    message: 'No se encontraron conceptos registrados'
                });
            }
            
            res.json({
                ok: true,
                concepts: resp
            });
        }).catch((err) => {
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});

module.exports = router;