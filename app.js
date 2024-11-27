const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { randFloat, randProductName, randProductDescription } = require('@ngneat/falso');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// DATABASE
const db = new sqlite3.Database('./products.db', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite');
    }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0.00,
    image_url TEXT,
    rating INTEGER DEFAULT 0
);`;

db.run(createTableQuery, (err) => {
    if (err) {
        console.error('Erreur lors de la création de la table:', err.message);
    } else {
        console.log('Table "products" prête.');
    }
});

async function fetchRandomProductImages() {
    let images = [];
    try {
        const response = await axios.get('https://fakestoreapi.com/products');
        images = response.data.map(product => product.image);
    } catch (error) {
        console.error('Erreur lors de la récupération des images:', error);
        images = ['https://via.placeholder.com/150'];
    }
    return images;
}

async function generateFakeProduct(images) {
    const name = randProductName();
    const description = randProductDescription();
    const imageUrl = images[Math.floor(Math.random() * images.length)];
    const price = randFloat(1, 100);
    const rating = Math.floor(Math.random() * 5) + 1;

    return {
        name: name,
        description: description,
        price: price,
        image_url: imageUrl,
        rating: rating
    };
}

app.get('/get-product', (req, res) => {
    const startId = parseInt(req.query.startId);
    const endId = parseInt(req.query.endId);

    const query = `SELECT * FROM products WHERE id BETWEEN ? AND ?`;
    db.all(query, [startId, endId], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des produits:', err.message);
            res.status(500).send('Erreur lors de la récupération des produits');
        } else {
            // Comptage des produits pour la pagination
            db.get('SELECT COUNT(*) AS count FROM products', (err, countRow) => {
                if (err) {
                    console.error('Erreur lors du comptage des produits:', err.message);
                    res.status(500).send('Erreur lors du comptage des produits');
                } else {
                    res.json({
                        products: rows,
                        totalProducts: countRow.count
                    });
                }
            });
        }
    });
});



app.listen(port, () => {
    console.log(`Serveur en écoute sur http://localhost:${port}`);
});
