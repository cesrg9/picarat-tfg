document.addEventListener('DOMContentLoaded', () => {

    $.ajax({
        url: '/isLoged',
        type: 'POST',
    }).done((data) => {
        modal_html = `<div id="modal1" class="modal1">${window.modal1.innerHTML}</div>`
        document.getElementById('main').innerHTML = modal_html
        document.getElementById('email').value = data.email
        funcionalidadBotones()
    })
})

$('#btn_open').click(function () {

    let email = document.getElementById('email_login').value
    let pssw = document.getElementById('pssw_login').value
    raw = {
        email: email,
        pssw: pssw
    }

    $.ajax({
        url: '/login',
        type: 'POST',
        data: JSON.stringify(raw),
        contentType: 'application/json',
        success: async (response) => {
            Swal.fire({
                title: "¡Acceso permitido!",
                text: "Ya puedes acceder a todas las funciones como usuario",
                icon: "success"
            }).then(() => {
                document.getElementById('error').style.display = 'none'
                window.location.reload()
            });
        },
        error: (xhr) => {
            document.getElementById('error').style.display = 'flex'
        } 
    })
})

$('#btn_open2').click(function () {

    document.getElementById('error2').style.display = 'none'

    let email = document.getElementById('email').value
    let pssw = document.getElementById('pssw').value
    let nombre = document.getElementById('nombre').value
    let tlf = document.getElementById('tlf').value

    raw = {
        email: email,
        pssw: pssw,
        nombre: nombre,
        tlf: tlf
    }

    $.ajax({
        url: '/register',
        type: 'POST',
        data: JSON.stringify(raw),
        contentType: 'application/json',
        success: async (response) => {
            Swal.fire({
                title: "¡Ya te has registrado!",
                text: "Ya puedes acceder a todas las funciones como usuario",
                icon: "success"
            }).then(() => {
                window.location.reload()
            });
        },
        error: (xhr, status, error) => {
            const errorMessage = xhr.responseJSON.error;
            document.getElementById('error2').style.display = 'flex';
            document.getElementById('error2').innerHTML = errorMessage;
        }
    })
})

function funcionalidadBotones() {


    $('#btn_logout').click(function () {

        $.ajax({
            url : '/logout',
            type : 'POST'
        }).done(() => {
            Swal.fire({
                title: "Has cerrado sesión",
                text: "Esperamos verte pronto ;)",
                icon: "success"
              }).then(() =>{
                window.location.reload();
              });
        })

    })

    $('.btn_modificar').click(async function () {

        let email = document.getElementById('email').value
        let pssw = document.getElementById('pssw').value
        let nombre = document.getElementById('nombre').value
        let tlf = document.getElementById('tlf').value

        info = {
            email: email,
            pssw: pssw,
            nombre: nombre,
            tlf: tlf
        }

        if(!(!pssw || pssw =='')){
            let raw = {
                psswd : pssw
            };
            await $.ajax({
                url: '/hashPsswd',
                type: 'POST',
                data: JSON.stringify(raw),
                contentType: 'application/json',
                success : (response) =>{
                    info.pssw = response.hashedPssws
                }
            })
        }

        for (key in info) {
            if (info[key] == "" || info[key] == undefined) {
                delete info[key]
            }
        }

        let raw = {
            coll: 'usuarios',
            data: info,
            query: { "data.email": email }
        };

        $.ajax({
            url: '/modifyElement',
            type: 'POST',
            data: JSON.stringify(raw),
            contentType: 'application/json',
            success: () => {
                Swal.fire({
                    title: "¡Acción procesada!",
                    text: "La información que has introducido ha sido actualizada",
                    icon: "success"
                });
            }
        })
    })
}