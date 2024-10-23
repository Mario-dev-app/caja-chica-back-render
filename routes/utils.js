const express = require('express');
const router = express.Router();
/* const hana = require('@sap/hana-client');
const { PARAMS } = require('../config/config'); */

//=====================================
// VALIDAR SI OF ESTÁ ABIERTA O EXISTE
//=====================================
/* router.get('/valid-of', (req, res) => {
    const of = req.query.of;
    const connection = hana.createConnection();

    connection.connect(PARAMS, (err) => {
        if (err) {
            connection.disconnect();
            return res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        }
        connection.exec('CALL "SBO_MARCO_PE"."MPSA_OF_APP" (?)', [of], (err, rows) => {
            if (err) {
                connection.disconnect();
                return res.status(500).json({
                    ok: false,
                    message: 'Error interno',
                    err
                });
            }

            if(rows.length === 0 || !rows) {
                return res.status(400).json({
                    ok: false,
                    message: 'No se encontró OF abierta o existente con ese número'
                });
            }

            connection.disconnect();
            res.json({
                ok: true,
                of: rows
            });
        }); 
    });

}); */

module.exports = router;