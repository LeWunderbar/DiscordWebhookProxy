const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CONFIGURATION ---
const AUTHORIZED_KEYS = (process.env.AUTHORIZED_KEYS || '').split(',').map(key => key.trim());

app.use(express.json({ limit: '10kb' }));

// Trust proxy (for Cloudflare or load balancers)
app.set('trust proxy', 1);

// Rate limiter
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100,
	message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Logging IPs for later firewall based blocking
app.use((req, res, next) => {
		const time = new Date().toISOString();
		const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
		console.log(`[${time}] Request from IP: ${ip}`);
		next();
  	});
  
// --- ROUTES ---
// Welcome page
app.get('/', (req, res) => {
  	res.send('<html><body><h1>Discord Webhook Proxy Server | Made by TheWunderbar (https://github.com/LeWunderbar/DiscordWebhookProxy)</h1></body></html>');
});

// Health check
app.get('/status', (req, res) => {
  	res.send('<html><body><h1>Up and Healthy</h1></body></html>');
});

// Webhook proxy endpoint
app.post('/api/webhooks/:webhookId/:webhookToken', async (req, res) => {
	const { webhookId, webhookToken } = req.params;
	const authHeader = req.headers['authorization'];
	if (!authHeader || !AUTHORIZED_KEYS.includes(authHeader.replace('Bearer ', ''))) {
		return res.status(401).send('Unauthorized');
	}

	if (!/^\d+$/.test(webhookId) || !/^[\w-]+$/.test(webhookToken)) {
		return res.status(400).send('Invalid webhook format.');
	}

	const discordWebhookUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`;

	try {
		const response = await axios.post(discordWebhookUrl, req.body, {
			headers: {
				'Content-Type': 'application/json',
			},
		});
		res.status(response.status).json(response.data);
	} catch (error) {
		console.error(`Error forwarding webhook: ${error.message}`);
		res.status(500).send('Internal Server Error');
	}
});

// Start server
app.listen(port, () => {
  	console.log(`Proxy server listening at http://localhost:${port}`);
});
