const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'app-desconhecido';
const BG_COLOR = process.env.BG_COLOR || '#2563eb';

// Configura o Handlebars desativando layout padrao
app.engine('handlebars', engine({ defaultLayout: false }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Cabeçalho HTTP obrigatorio de identificação
app.use((req, res, next) => {
    res.setHeader('X-Served-By', INSTANCE_ID);
    next();
});

// Rota principal
app.get('/', (req, res) => {
    // Horario no fuso de São Paulo
    const saoPauloTime = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium'
    });

    res.render('index', {
        instanceId: INSTANCE_ID,
        bgColor: BG_COLOR,
        timestamp: saoPauloTime
    });
});

// Rota de Health Check exigida no trabalho
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', instance: INSTANCE_ID });
});

app.listen(PORT, () => {
    console.log(`Instância ${INSTANCE_ID} rodando na porta ${PORT}`);
});