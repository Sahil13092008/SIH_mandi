import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { smsService } from './server/smsService';
import { MSP_DATA } from './src/utils/translations';
import { CreateTokenSchema, FarmerProfileSchema, AdvanceStatusSchema } from './src/utils/validation';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS Policy (C-4)
  const ALLOWED_ORIGINS = [
    'https://sih-mandi.sisodesahil60.workers.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://sih-mandi.sisodesahil60.workers.dev');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-demo-secret');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // SSE Clients for real-time live synchronization (M-8: Heartbeat & leak prevention)
  let sseClients: express.Response[] = [];

  function broadcastEvent(type: string, data: any) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients = sseClients.filter(res => {
      try {
        res.write(payload);
        return true;
      } catch (err) {
        return false;
      }
    });
  }

  // Periodic SSE Heartbeat to purge dead sockets (M-8)
  const heartbeatTimer = setInterval(() => {
    sseClients = sseClients.filter(res => {
      try {
        res.write(':keepalive\n\n');
        return true;
      } catch (err) {
        return false;
      }
    });
  }, 20000);

  // Hook into SMS service broadcasts to send SSE
  smsService.subscribe(newSms => {
    broadcastEvent('sms_sent', newSms);
  });

  // SSE Endpoint
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.push(res);

    // Initial heartbeat
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Mandi Queue Live Stream' })}\n\n`);

    req.on('close', () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Centers API
  app.get('/api/centers', (req, res) => {
    const centers = Array.from(db.centers.values());
    res.json(centers);
  });

  app.get('/api/centers/:id/queue', (req, res) => {
    const centerId = req.params.id;
    const queue = db.getCenterQueue(centerId);
    const center = db.centers.get(centerId);
    res.json({ center, queue });
  });

  // 2. Farmers API
  app.post('/api/farmers/register', (req, res) => {
    const parseResult = FarmerProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }
    const { name, phone, village, district, aadhaar_last4, bank_account_last4, is_aadhaar_verified } = parseResult.data;

    // Check if farmer exists by phone
    let farmer = Array.from(db.farmers.values()).find(f => f.phone === phone);
    if (!farmer) {
      const farmer_id = `f-${Date.now()}`;
      farmer = {
        farmer_id,
        name: name || 'Kisan Bhaai',
        phone,
        village: village || 'Local Gram',
        district: district || 'Indore',
        aadhaar_last4: aadhaar_last4 || Math.floor(1000 + Math.random() * 9000).toString(),
        bank_account_last4: bank_account_last4 || Math.floor(1000 + Math.random() * 9000).toString(),
        is_aadhaar_verified: is_aadhaar_verified ?? true,
        created_at: new Date().toISOString()
      };
      db.farmers.set(farmer_id, farmer);
    } else {
      // Update info if provided
      if (name) farmer.name = name;
      if (village) farmer.village = village;
      if (district) farmer.district = district;
      if (aadhaar_last4) farmer.aadhaar_last4 = aadhaar_last4;
      if (bank_account_last4) farmer.bank_account_last4 = bank_account_last4;
      if (is_aadhaar_verified !== undefined) farmer.is_aadhaar_verified = is_aadhaar_verified;
    }

    res.json(farmer);
  });

  app.patch('/api/farmers/:id', (req, res) => {
    const farmerId = req.params.id;
    const parseResult = FarmerProfileSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parseResult.error.flatten() });
    }
    const updated = db.updateFarmer(farmerId, parseResult.data);
    if (!updated) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    broadcastEvent('farmer_updated', updated);
    res.json(updated);
  });

  app.get('/api/farmers/:phone/tokens', (req, res) => {
    const phone = req.params.phone;
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }
    const farmerTokens = Array.from(db.tokens.values())
      .filter(t => t.farmer_phone === phone)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(farmerTokens);
  });

  // 3. Tokens API
  app.post('/api/tokens', (req, res) => {
    const parseResult = CreateTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Token creation validation failed', details: parseResult.error.flatten() });
    }

    const {
      farmer_id,
      farmer_name,
      farmer_phone,
      farmer_village,
      crop,
      quantity,
      center_id,
      preferred_slot
    } = parseResult.data;

    // Ensure farmer profile exists
    let farmer = db.farmers.get(farmer_id);
    if (!farmer) {
      farmer = Array.from(db.farmers.values()).find(f => f.phone === farmer_phone);
    }
    if (!farmer) {
      const fId = `f-${Date.now()}`;
      farmer = {
        farmer_id: fId,
        name: farmer_name || 'Farmer',
        phone: farmer_phone,
        village: farmer_village || 'Local Village',
        aadhaar_last4: Math.floor(1000 + Math.random() * 9000).toString(),
        bank_account_last4: Math.floor(1000 + Math.random() * 9000).toString(),
        created_at: new Date().toISOString()
      };
      db.farmers.set(fId, farmer);
    }

    // Force official MSP rate - client-sent rate is never blindly trusted (H-7)
    const officialRate = (MSP_DATA as any)[crop]?.rate || 2275;

    const token = db.createToken({
      farmer_id: farmer.farmer_id,
      farmer_name: farmer.name,
      farmer_phone: farmer.phone,
      farmer_village: farmer.village,
      center_id,
      crop,
      quantity: Number(quantity),
      msp_rate: officialRate,
      preferred_slot: preferred_slot || '07:00 AM - 09:00 AM'
    });

    broadcastEvent('token_created', token);
    broadcastEvent('queue_updated', { center_id });

    res.status(201).json(token);
  });

  app.get('/api/tokens/:id', (req, res) => {
    const token = db.tokens.get(req.params.id);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    res.json(token);
  });

  app.patch('/api/tokens/:id/status', (req, res) => {
    const parseResult = AdvanceStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid status update payload', details: parseResult.error.flatten() });
    }

    const { status, quality_check_result, note } = parseResult.data;
    const updated = db.updateTokenStatus(req.params.id, status, quality_check_result, note);
    if (!updated) {
      return res.status(404).json({ error: 'Token not found' });
    }

    broadcastEvent('token_updated', updated);
    broadcastEvent('queue_updated', { center_id: updated.center_id });

    res.json(updated);
  });

  app.post('/api/tokens/:id/payment-webhook', (req, res) => {
    const reference_id = req.body.reference_id || `UPI-DBT-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const updated = db.processPaymentWebhook(req.params.id, reference_id);
    if (!updated) {
      return res.status(404).json({ error: 'Token not found' });
    }

    broadcastEvent('token_updated', updated);
    broadcastEvent('payment_confirmed', updated);
    broadcastEvent('queue_updated', { center_id: updated.center_id });

    res.json({
      success: true,
      message: 'Simulated UPI payment webhook processed successfully',
      token: updated
    });
  });

  // 4. SMS Log API
  app.get('/api/sms-log', (req, res) => {
    const phone = req.query.phone as string;
    let logs = smsService.getLogs();
    if (phone) {
      logs = logs.filter(l => l.phone.includes(phone));
    }
    res.json(logs);
  });

  app.delete('/api/sms-log', (req, res) => {
    smsService.clearLogs();
    res.json({ success: true, message: 'SMS logs cleared' });
  });

  // 5. Analytics API
  app.get('/api/analytics/centers/:id', (req, res) => {
    const analytics = db.getCenterAnalytics(req.params.id);
    if (!analytics) {
      return res.status(404).json({ error: 'Center not found' });
    }
    res.json(analytics);
  });

  app.get('/api/analytics/overview', (req, res) => {
    const overview = db.getMinistryOverview();
    res.json(overview);
  });

  // 6. Reset Demo Seed Data
  app.post('/api/seed/reset', (req, res) => {
    db.seed();
    broadcastEvent('seed_reset', { message: 'Database reset to initial demo state' });
    res.json({ success: true, message: 'Demo data reset successfully' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mandi Queue Server running on http://localhost:${PORT}`);
  });
}

startServer();
