const express = require('express');
const { ObjectId } = require('mongodb');
const { client, connectDB, closeDB } = require('./src/mongodb');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    req.db = client.db('MundialDB');
    req.collection = req.db.collection('equipos');
    next();
});

app.get('/equipos', async (req, res) => {
    const equipos = await req.collection.find().toArray();
    res.status(200).json(equipos);
});

app.get('/equipos/buscar', async (req, res) => {
    const { tecnico } = req.query;

    const equipos = await req.collection.find({
        tecnico: { $regex: tecnico, $options: 'i' }
    }).toArray();

    res.status(200).json(equipos);
});

app.get('/equipos/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    const equipo = await req.collection.findOne({ _id: new ObjectId(id) });

    if (!equipo) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json(equipo);
});

app.post('/equipos', async (req, res) => {
    const { equipo, tecnico, continente, campeonatos_mundiales } = req.body;

    if (
        typeof equipo !== 'string' ||
        typeof tecnico !== 'string' ||
        typeof continente !== 'string' ||
        typeof campeonatos_mundiales !== 'number'
    ) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    const nuevoEquipo = {
        equipo,
        tecnico,
        continente,
        campeonatos_mundiales
    };

    const resultado = await req.collection.insertOne(nuevoEquipo);

    res.status(201).json({
        _id: resultado.insertedId,
        ...nuevoEquipo
    });
});

app.put('/equipos/:id', async (req, res) => {
    const { id } = req.params;
    const { equipo, tecnico, continente, campeonatos_mundiales } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    if (
        typeof equipo !== 'string' ||
        typeof tecnico !== 'string' ||
        typeof continente !== 'string' ||
        typeof campeonatos_mundiales !== 'number'
    ) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    const resultado = await req.collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                equipo,
                tecnico,
                continente,
                campeonatos_mundiales
            }
        }
    );

    if (resultado.matchedCount === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json({ mensaje: 'Equipo actualizado correctamente' });
});

app.delete('/equipos/:id', async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    const resultado = await req.collection.deleteOne({ _id: new ObjectId(id) });

    if (resultado.deletedCount === 0) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.status(200).json({ mensaje: 'Equipo eliminado correctamente' });
});

if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor escuchando en http://localhost:${PORT}`);
        });
    });
}

module.exports = { app, closeDB, client, connectDB };