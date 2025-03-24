require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || "supersecreto";

// Datos falsos de usuario
const USER_FAKE = {
  name: "Luis",
  lastName: "Cutz",
  password: "pass123",
  email: "luis@email.com",
};

// Ruta pública
app.get("/", (req, res) => {
  res.json({ message: "Demo APP NGROK" });
});

// Endpoint de login
app.post("/auth", (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);

  // Validación contra datos falsos
  if (email !== USER_FAKE.email || password !== USER_FAKE.password) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  // Generar token JWT
  const token = jwt.sign({ email: USER_FAKE.email }, SECRET_KEY, {
    expiresIn: "1h",
  });

  const dataResponse = {
    name: USER_FAKE.name,
    lastName: USER_FAKE.lastName,
    email: USER_FAKE.email,
    token,
  };

  res.json({ message: "Inicio de sesión exitoso", data: dataResponse });
});

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ message: "Token requerido" });
  }

  jwt.verify(token.split(" ")[1], SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    req.user = decoded;
    next();
  });
};

// Ruta protegida
app.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Acceso autorizado", user: req.user });
});

// Función para enviar la notificación push utilizando Expo con axios
async function sendPushNotification(expoPushToken, title, body, data) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log('Notificación enviada correctamente');
    } else {
      console.error('Error al enviar notificación:', response.data);
    }
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
}

// Ruta para recibir el token y enviar la notificación
app.post('/send-notification', (req, res) => {
  const { token, title, body, data } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ message: 'Token, título y cuerpo son necesarios.' });
  }

  sendPushNotification(token, title, body, data)
    .then(() => res.json({ message: 'Notificación enviada correctamente' }))
    .catch(error => res.status(500).json({ message: 'Error al enviar notificación', error }));
});

// Iniciar servidor
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);