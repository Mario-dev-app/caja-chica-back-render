const express = require('express');
const router = express.Router();
const CashOutlay = require('../models/cash-outlay');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

//=================================
// REGISTRAR CASH_IN DE FONDO FIJO
//=================================
router.post('/cash-outlay', async (req, res) => {
    const body = req.body;

    const lastRegister = await CashOutlay.findOne({ asignado_a: body.asignado_a }).sort({ fecha_registro: -1 });

    let calcBalance;
    if(lastRegister) {
        calcBalance = Number(body.monto) + Number(lastRegister.balance);
    }else {
        calcBalance = body.monto;
    }

    CashOutlay.create({
        monto: body.monto,
        tipo: body.tipo,
        user_id: body.user_id,
        asignado_a: body.asignado_a,
        balance: calcBalance
    }).then((resp) => {
        res.json({
            ok: true,
            resp,
            message: 'Se registró correctamente la asignación de dinero'
        });
    }).catch((err) => {
        return res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
    /* if (!lastRegister) {
    } else {
        let calcBalance = body.tipo === 'CASH_IN' ? Number(body.monto) + Number(lastRegister.balance) : Number(lastRegister.balance) - Number(body.monto);
        CashOutlay.create({
            monto: body.monto,
            tipo: body.tipo,
            user_id: body.user_id,
            balance: calcBalance
        }).then((resp) => {
            res.json({
                ok: true,
                resp,
                message: 'Se registró correctamente la asignación de dinero'
            });
        }).catch((err) => {
            return res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
    } */
});

//==============================================
// OBTENER TODOS LOS REGISTROS CASH_IN CASH_OUT
//==============================================
router.get('/cash-outlay', (req, res) => {
    const page = req.query.p;
    const limit = 5;
    const skip = page * limit;

    CashOutlay.find({})
        .populate(['user_id', 'money_request_id'])
        .sort({ fecha_registro: -1 })
        .skip(skip)
        .limit(limit)
        .exec().then(async (resp) => {
            
            const filteredResult = resp.filter(result => {
                if(!result.money_request_id) {
                    return result;
                }
                
                if(!['DESEMBOLSADO', 'RECHAZADO', 'APROBADO'].includes(result.money_request_id?.estado)) {
                    return result;
                }
            });
            if (filteredResult.length === 0) {
                return res.status(400).json({
                    ok: false,
                    message: 'No se encontraron registros'
                });
            }
            const count = await CashOutlay.countDocuments();
            res.json({
                ok: true,
                cash_outlays: filteredResult,
                count
            });

        }).catch((err) => {
            console.log(err);
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});


//========================================
// OBTENER TODOS LOS REGISTROS DE CASH_IN
//========================================
router.get('/cash-in', (req, res) => {
    const page = req.query.p;
    const limit = 5;
    const skip = page * limit;

    CashOutlay.find({ tipo: 'CASH_IN' })
        .populate(['user_id', 'asignado_a'])
        .sort({ fecha_registro: -1 })
        .skip(skip)
        .limit(limit)
        .exec().then( async (resp) => {
            const count = await CashOutlay.countDocuments({ tipo: 'CASH_IN' });
            res.json({
                ok: true,
                cash_in: resp,
                count
            });
        }).catch((err) => {
            res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        });
});

//===========================================
// FILTRAR CASH OUTLAYS POR RANGO DE FECHAS
//===========================================
router.get('/cash-outlay-filters', (req, res) => {
    const desde = new Date(req.query.desde);
    const hasta = new Date(req.query.hasta);

    CashOutlay.find({
        fecha_registro: {
            $gte: desde,
            $lte: hasta
        },
        tipo: 'CASH_IN'
    }).populate(['user_id', 'asignado_a']).sort({ fecha_registro: -1 }).exec().then((resp) => {
        res.json({
            ok: true,
            cash_outlays: resp
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
});

//==================================================
// GENERAR REPORTE DE EXCEL CON EL FILTRO DE FECHAS
//==================================================
router.get('/cash-outlay-excel-report', async (req, res) => {
    const desde = new Date(req.query.desde);
    let hasta = new Date(req.query.hasta);
    hasta = Date(hasta.getDate() + 1);

    const cashOutlayData = await CashOutlay.find({
        fecha_registro: {
            $gte: desde,
            $lte: hasta
        },
        tipo: 'CASH_OUT'
    })
        .populate({
            path: 'user_id',
            select: 'nombre apellidos empresa sede'
        })
        .populate({
            path: 'money_request_id',
            select: 'descripcion monto_total area_id approver user_id fecha_registro fecha_aprobacion fecha_desembolso faltante sobrante',
            populate: {
                path: 'user_id area_id approver',
                select: 'nombre apellidos empresa sede descripcion'
            }
        })
        .sort({ fecha_registro: -1 });

    console.log(cashOutlayData);

    const reportPath = path.join(__dirname, '..', 'report', 'report.xlsx');
    let workbook;
    let sheet;

    if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
    }

    workbook = new ExcelJS.Workbook();
    sheet = workbook.addWorksheet('My Sheet');

    sheet.columns = [
        { header: 'Caja', key: 'caja', width: 20 },
        { header: 'Sociedad', key: 'sociedad', width: 20 },
        { header: 'Sede', key: 'sede', width: 20 },
        { header: 'Monto', key: 'monto', width: 20 },
        { header: 'Solicitante', key: 'solicitante', width: 20 },
        { header: 'Área', key: 'area', width: 20 },
        { header: 'Aprobador', key: 'aprobador', width: 20 },
        { header: 'Descripción', key: 'descripcion', width: 20 },
        { header: 'Fecha de registro', key: 'fecha_reg', width: 20 },
        { header: 'Fecha de aprobación', key: 'fecha_aprov', width: 20 },
        { header: 'Fecha de desembolso', key: 'fecha_desemb', width: 20 },
    ];

    sheet.getRow(1).eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };

        cell.fill = {
            type: 'gradient',
            gradient: 'angle',
            degree: 90,
            stops: [
                { position: 0, color: { argb: 'ff008598' } },
                { position: 1, color: { argb: 'ff002343' } }
            ]
        }

        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    cashOutlayData.forEach((reg) => {
        const row = sheet.addRow({
            caja: `${reg.user_id.nombre} ${reg.user_id.apellidos}`,
            sociedad: reg.user_id.empresa,
            sede: reg.user_id.sede,
            monto: reg.monto,
            solicitante: `${reg.money_request_id.user_id.nombre} ${reg.money_request_id.user_id.apellidos}`,
            area: reg.money_request_id.area_id.descripcion,
            aprobador: `${reg.money_request_id.approver.nombre} ${reg.money_request_id.approver.apellidos}`,
            descripcion: reg.money_request_id.descripcion,
            fecha_reg: reg.money_request_id.fecha_registro,
            fecha_aprov: reg.money_request_id.fecha_aprobacion,
            fecha_desemb: reg.money_request_id.fecha_desembolso
        });

        const montoCell = row.getCell('monto');
        montoCell.numFmt = '#,##0.00';
        /* const balance = row.getCell('balance');
        balance.numFmt = '#,##0.00'; */
    });

    await workbook.xlsx.writeFile(reportPath);

    res.download(reportPath, 'report.xlsx', (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                message: 'Error interno',
                err
            });
        }
    });

});

//===============================================
// OBTENER ULTIMO REGISTRO DE CASH_IN | CASH_OUT
//===============================================
router.get('/last-cashin-cashout', (req, res) => {
    const asignado_a = req.query.asignadoA;
    CashOutlay.findOne({ tipo: 'CASH_IN', asignado_a })
        .sort({ fecha_registro: -1 })
        .exec()
        .then((resp) => {
            res.json({
                ok: true,
                last_cash_outlay: resp
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