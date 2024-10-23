const express = require('express');
const router = express.Router();
const Area = require('../models/area');

//===========================
// REGISTRAR AREA DE TRABAJO
//===========================
router.post('/area', (req, res) => {
    const body = req.body;

    Area.create({
        descripcion: body.descripcion
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

//=========================
// OBTENER TODAS LAS ÁREAS
//=========================
router.get('/areas', (req, res) => {
    /* Area.find({ descripcion: {$regex: '.*' + 'Sis' + '.*'}}) */
    Area.find({})
    .exec()
    .then((resp) => {
        if(resp.length === 0) {
            return res.status(400).json({
                ok: false,
                message: 'No se encontraron áreas registradas'
            });
        }

        res.json({
            ok: true,
            areas: resp
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