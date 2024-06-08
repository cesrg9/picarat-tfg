/* 
  TODO:
    - El resto se va a quedar un poco como está

    - Tener en cuenta que hay que cambiar el .env

    - Especificar el uso de chatGPT para el bcrypt, que se ha buscado una manera de codificar las contraseñas, que se ha complementado la info básica con la documentacion y que lo he adaptado al  proyecto
    - Explicar un poco el funcionamiento de bcrypt
    - Explicar el uso de crypto y que ha salido de stackoverflow
*/


const session = require('express-session');
const crypto = require("crypto");
const express = require('express');
const MongoDB = require('./mongodb')
const path = require('path');
const app = express();

const port = 3030;

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
  secret: crypto.randomBytes(16).toString("hex"),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
// Ver como se hace en triage

app.listen(port, function () {
  console.log('Servidor iniciado en puerto:', port);
});

// Página de inicio, al acceder se cargan los eventos
app.route('/').get((_req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'index.html'))
}).post(async (req, res) => {
    req.session.email = '2'
    req.session.admin = true
    try {
      eventos = await MongoDB.fetch_all('eventos')
      return res.status(200).send(eventos)

    } catch (error) {
      return res.status(500).send(error)
    }
})

// Página de carta, al acceder se cargan los elementos
app.route('/carta').get((_req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'carta.html'))
}).post(async (req, res) => {
  try {
    carta = await MongoDB.fetch_all(req.body.coleccion)
    return res.status(200).send(carta)

  } catch (error) {
    return res.status(500).send(error)
  }

})

app.route('/articulos').get((req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'articulos.html'))
}).post(async (req, res) => {
  try {
    articulos = await MongoDB.fetch_all(req.body.coleccion)
    return res.status(200).json({ articulos: articulos })
  } catch (error) {
    return res.status(500).send(error)
  }
})


app.route('/login').get((req, res) => {
    return res.sendFile(path.join(__dirname, 'public', 'login.html'))
}).post(async (req, res) => {
    email = req.body.email
    pssw = req.body.pssw

    dbUserInfo = await MongoDB.getUserData(email, pssw)

    if (dbUserInfo.length == 1) {

      req.session.email = email

      if (dbUserInfo[0].data.admin) {
        req.session.admin = true
      }
      return res.status(200).send('ok')
    } else {
      return res.status(404).send('error')
    }
  })

app.route('/reservas').get((req, res) => {
    if (!req.session.email) {
      return res.redirect('/login')
    } else {
      return res.sendFile(path.join(__dirname, 'public', 'reservas.html'))
    }
}).post(async (req, res) => {

  try {

    if (!req.session.admin) {
      query = { 'data.email': req.session.email }
    } else {
      query = { 'data.estado': 'pendiente' }
    }

    reservas = await MongoDB.fetchWithQuery(query, req.body.coleccion)

    return res.status(200).json({ bool: req.session.admin, reservas: reservas }) //// FIJARSE EN ESTO REFERENCIA


  } catch (error) {
    console.log(error)
  }

})


app.post('/register', async (req, res) => {

  let info = req.body


  response = await MongoDB.newUser(info)

  if (!response.acknowledged) {
    return res.send('error')
  } else {
    if(response.admin){
      req.session.admin = true
    }
    req.session = email

    return res.send('ok')
  }

})

app.post('/getButton', (req, res) => {
  if (req.session.email && req.session.admin) {

    btn = `<button class="admin_btn">Modificar Información</button>  <button class="admin_btn2">Añadir más Información</button>`

    return res.send(btn)
  }
})

app.post('/asignarReserva', async (req, res) => {

  email = req.session.email
  date = req.body.date
  n_personas = req.body.n_personas
  estado = req.body.estado

  response = await MongoDB.newReserva(email, date, n_personas, estado)

  if (response) {
    return res.send('ok')
  } else {
    return res.send('error')
  }

})

app.post('/asignarEvento', async (req, res) => {

  email = req.session.email
  evento = req.body.evento
  estado = req.body.estado

  response = await MongoDB.reservaEvento(email, evento, estado)

  if (response) {
    return res.send('ok')
  } else {
    return res.send('error')
  }

})


app.post('/getInfo', async (req, res) => {
  try {
    eventos = await MongoDB.fetch_all(req.body.coleccion)
    res.send(eventos)
  } catch (error) {
    console.log(error)
  }
})

app.post('/getInfoEvento', async (req, res) => {

  try {
    id = req.body.id
    coleccion = 'eventos'

    evento = await MongoDB.fetchOne(id, coleccion)
    if(!req.session.admin){
      delete evento.Participantes
    }
    
    return res.send(evento)

  } catch (error) {
    console.log(error)
  }


})

app.post('/modifyElement', async (req, res) => {

  data = req.body.data
  coll = req.body.coll
  query = req.body.query

  response = await MongoDB.findAndUpdate(data, query, coll)
  if (!response.acknowledged) {
    return res.send('error')
  } else {
    return res.send('ok')
  }
})

app.post('/addElement', async (req, res) => {

  data = req.body.data
  coll = req.body.coll

  response = await MongoDB.addOne(data, coll)
  if (!response.acknowledged) {
    return res.send('error')
  } else {
    return res.send('ok')
  }
})

app.post('/deleteElement', async (req, res) => {

  data = req.body.data
  coll = req.body.coll

  response = await MongoDB.deleteOne(data, coll)
  if (response.deletedCount !== 1) {
    return res.status(500)
  } else {
    return res.status(200).send('ok')
  }
})

app.post('/isLoged', async (req, res) => {


  if (req.session.email) {
    return res.status(200).json({ email: req.session.email })
  } else {
    return res.status(500)
  }

})

app.post('/logout', (req, res) => {
  req.session.destroy();
  return res.status(200).send('ok')
});

app.post('/modifyParticipantes', async (req, res) => {

  try {

    query = req.body.query
    email = req.session.email
    coleccion = 'eventos'

    evento = await MongoDB.fetchWithQuery(query, coleccion)
    
    participantes = evento[0].data.Participantes

    participantes.push(email)

    data  = {
      'Participantes' : participantes
    }

    response = await MongoDB.findAndUpdate(data, query, coleccion)

    return res.send(evento)
    } catch (error) {
      console.log(error)
  }


})