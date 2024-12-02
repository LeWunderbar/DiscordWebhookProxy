const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.set('trust proxy', true);

app.use((req, res, next) => {
	const time = new Date().toISOString();
	const ip = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
	console.log(`[${time}] Request from IP: ${ip}`);
	next();
});
  
app.use(express.json());

app.get('/', (req, res) => {
  	res.send('<html><body><h1>Discord Webhook Proxy Server | Made by M23__ on discord</h1></body></html>');
});

app.post('/api/webhooks/:webhookId/:webhookToken', async (req, res) => {
	const { webhookId, webhookToken } = req.params;
	const discordWebhookUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`;

	try {
		const response = await axios.post(discordWebhookUrl, req.body);
		res.status(response.status).json(response.data);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Internal Server Error');
	}
});

// Status
app.get('/status', (req, res) => {
  	res.send('<html><body><h1>Up and Healthy</h1></body></html>');
});

app.listen(port, () => {
  	console.log(`Proxy server listening at http://localhost:${port}`);
});