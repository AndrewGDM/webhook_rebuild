const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/associate-ticket', async (req, res) => {
  const { ticketId, orderNumber } = req.body;

  if (!ticketId || !orderNumber) {
    return res.status(400).json({ error: 'Missing ticketId or orderNumber' });
  }

  try {
    const headers = {
      Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const searchResp = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/deals/search',
      {
        filterGroups: [{
          filters: [{
            propertyName: 'order_number',
            operator: 'EQ',
            value: orderNumber
          }]
        }],
        properties: ['dealname'],
        limit: 1
      },
      { headers }
    );

    const match = searchResp.data.results[0];
    if (!match) {
      return res.status(404).json({ error: 'No matching deal found' });
    }

    const dealId = match.id;

    await axios.put(
      `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}/associations/deals/${dealId}/ticket_to_deal`,
      {},
      { headers }
    );

    res.json({ success: true, dealId });
  } catch (error) {
    console.error('Webhook error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
