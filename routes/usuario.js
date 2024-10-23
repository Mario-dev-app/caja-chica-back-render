const express = require('express');
const router = express.Router();
const Usuario = require('../models/usuario');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const { APP_ID, REST_API_KEY } = require('../config/config');

//====================
// REGISTRAR USUARIO
//====================
router.post('/usuario', (req, res) => {
    const body = req.body;

    Usuario.create({
        usuario: body.usuario,
        password: bcrypt.hashSync(body.password, 10),
        nombre: body.nombre,
        apellidos: body.apellidos,
        correo: body.correo,
        role: body.role,
        empresa: body.empresa,
        sede: body.sede
    }).then((result) => {
        res.json({
            ok: true,
            message: 'Usuario registrado',
            result
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        })
    });
});

//============================
// OBTENER TODOS LOS USUARIOS
//============================
router.get('/usuario/:username', (req, res) => {
    const username = req.params.username;
    Usuario.find({ usuario: username }).exec().then((resp) => {
        return res.json({
            ok: true,
            usuarios: resp
        });
    }).catch((err) => {
        return res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    })
});

//====================
// MODIFICAR USUARIO
//====================
router.put('/usuario/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body;

    Usuario.findByIdAndUpdate( id, {
        usuario: body.usuario,
        password: bcrypt.hashSync(body.password, 10),
        nombre: body.nombre,
        apellidos: body.apellidos,
        correo: body.correo,
        role: body.role,
        empresa: body.empresa,
        sede: body.sede
    }).then((result) => {
        res.json({
            ok: true,
            message: 'Usuario actualizado',
            result
        });
    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        })
    });
});

//===================
// LOGIN PORTAL WEB                    
//===================
router.post('/login-wp', (req, res) => {
    const body = req.body;

    Usuario.findOne({
        usuario: body.usuario
    }).then((result) => {
        if (!result) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario o contraseña incorrecto'
            });
        }

        const passwordValid = bcrypt.compareSync(body.password, result.password);

        if (!passwordValid) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario o contraseña incorrecto'
            });
        }

        let allowedRoles = ['ADMIN', 'FINZ'];

        if (!allowedRoles.includes(result.role)) {
            return res.status(400).json({
                ok: false,
                message: 'El usuario no tiene el rol necesario para ingresar a la plataforma'
            });
        }

        res.json({
            ok: true,
            usuario: {
                _id: result._id,
                usuario: result.usuario,
                nombre: result.nombre,
                apellidos: result.apellidos,
                role: result.role
            }
        });

    }).catch((err) => {
        res.status(500).json({
            ok: false,
            message: 'Error interno',
            err
        });
    });
});

//===========
// LOGIN APP
//===========
router.post('/login', (req, res) => {
    const body = req.body;

    Usuario.findOne({
        usuario: body.usuario,
        activo: true
    }).then(async (result) => {

        if (!result) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario o contraseña incorrecto'
            });
        }

        const passwordValid = bcrypt.compareSync(body.password, result.password);

        if (!passwordValid) {
            return res.status(400).json({
                ok: false,
                message: 'Usuario o contraseña incorrecto'
            });
        }

        if (!result.onesignal_id) {
            if (body.onesignal_id) {
                result.onesignal_id = body.onesignal_id;
                result.external_id = result._id;
                await result.save();

                /* REGISTRAR EXTERNAL ID EN ONESIGNAL */
                registrarTagOneSignal(result._id, body.onesignal_id);
            }
        }

        res.json({
            ok: true,
            usuario: {
                _id: result._id,
                usuario: result.usuario,
                nombre: result.nombre,
                apellidos: result.apellidos,
                role: result.role,
                correo: result.correo
            }
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


//=========================
// REGISTRAR TAG ONESIGNAL
//=========================
const registrarTagOneSignal = async (_id, onesignal_id) => {
    let data = {
        app_id: APP_ID,
        properties: {
            tags: { external_id: _id }
        },
        identity: {
            onesignal_id: onesignal_id,
        }
    };

    const url = `https://api.onesignal.com/apps/${APP_ID}/users`;
    const options = {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': `Basic ${REST_API_KEY}` },
        body: JSON.stringify(data)
    };

    try {
        await fetch(url, options);
    } catch (error) {
        console.log('Error en el registro del tag: ', error);
    }
}

//===========================================
// OBTENER USUARIOS ADMINISTRADORES DE CAJA
//===========================================
router.get('/usuarios-admin', (req, res) => {
    Usuario.find({ role: 'ADMIN', activo: true })
        .select(['_id', 'usuario', 'nombre', 'apellidos', 'empresa', 'sede'])
        .exec()
        .then((resp) => {
            if(resp.length === 0) {
                return res.status(400).json({
                    ok: false,
                    message: 'No se encontraron usuarios con rol ADMIN'
                });
            }

            res.json({
                ok: true,
                usuarios: resp
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