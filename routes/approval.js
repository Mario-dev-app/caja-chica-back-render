const express = require('express');
const router = express.Router();
const Approval = require('../models/approval');
const MoneyRequest = require('../models/money-request');

//======================
// REGISTRAR APROBADOR                    
//======================
router.post('/approval', (req, res) => {
    const body = req.body;

    Approval.create({
        approval_id: body.approval_id,
        user_id: body.user_id
    }).then((resp) => {
        res.json({
            ok: true,
            message: 'Aprobador registrado',
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

//=================================
// OBTENER SOLICIUTDES POR APROBAR                    
//=================================
router.get('/approvals/:id', async (req, res) => {
    const approval_id = req.params.id;

    try {
        const approvals = await Approval.find({ approval_id, user_id: { $ne: approval_id } });

        const moneyRequestsPromise = approvals.map(async(approval) => {
            return await MoneyRequest.find({ user_id: approval.user_id, estado: 'POR REVISAR' }).populate(['user_id', 'area_id']);
        });

        const moneyRequestArr = await Promise.all(moneyRequestsPromise);

        const moneyRequests = [].concat(...moneyRequestArr);
        
        res.json({
            moneyRequests: moneyRequests
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            message: 'Error interno',
            err: error
        });
    }

});


module.exports = router;