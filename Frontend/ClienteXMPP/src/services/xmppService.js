import { client, xml, jid } from '@xmpp/client';
import { Buffer } from 'buffer';
import process from "process"; 

const initXmpp = function (xmpp) {
  xmpp.on('error', (err) => {
    console.error("Error occurred", err.toString());
  });

  xmpp.on('offline', () => {
    console.log('🛈', 'offline');
  });

  xmpp.on('online', async (address) => {
    console.log("Online as:", address.toString());
    // Send initial presence
    await xmpp.send(xml('presence'));

    // Keep-alive mechanism
    setInterval(async () => {
      console.log('Sending keep-alive presence');
      await xmpp.send(xml('presence'));
    }, 30000); // Every 30 seconds
  });

  xmpp.on('stanza', (stanza) => {
    console.log('⮈', stanza.toString());
    // Handle stanzas if needed
  });

  xmpp.on('status', (status) => {
    console.log('🛈', 'status:', status);
  });

  process.on('unhandledRejection', function (reason, p) {
    console.error('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
  });

  try {
    xmpp.start();
  } catch (e) {
    console.error(e.message);
  }
};

const connectXmpp = async () => {
  try {
    const clientInstance = new client({
      service: "xmpp://alumchat.lol:5222",
      domain: "alumchat.lol",
      username: "her21270-test1",
      password: "1234",
      tlsOptions: {
        rejectUnauthorized: false
      }
    });

    initXmpp(clientInstance);
  } catch (e) {
    console.error(e);
    setTimeout(connectXmpp, 5000); // Retry connection after 5 seconds
  }
};

const disconnectXmpp = async (xmpp) => {
  try {
    await xmpp.stop();
    console.log("Disconnected");
  } catch (e) {
    console.error("Failed to disconnect", e);
  }
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export { connectXmpp, disconnectXmpp };
