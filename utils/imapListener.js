import { ImapFlow } from "imapflow";
import imapModel from "../models/imapModel.js";
import { simpleParser } from "mailparser";

export const createListener = async (imap) => {
  let client;

  try {
    client = new ImapFlow({
      host: imap.imapHost,
      port: imap.imapPort,
      secure: true,
      auth: {
        user: imap.imapUser,
        pass: imap.imapPass,
      },
    });

    await client.connect();
    await imapModel.findByIdAndUpdate(imap._id, { status: "valid" });
    await client.mailboxOpen("INBOX");
  } catch (err) {
    await imapModel.findByIdAndUpdate(imap._id, { status: "invalid" });
    return;
  }

  client.on("exists", async () => {
    let lock = await client.getMailboxLock("INBOX");
    try {
      for await (let msg of client.fetch("*", {
        envelope: true,
        source: true,
      })) {
        processEmail(imap.userId.toString(), msg);
      }
    } finally {
      lock.release();
    }
  });

  client.on("error", () => {});
};

async function processEmail(id, msg) {
  const parsed = await simpleParser(msg.source);
  const sender = parsed.from.text;
  const senderEmail = sender.match(/<([^>]+)>/)[1];
  const subject = parsed.subject || "";
  const body = parsed.text || "";
  const webhookUrl = "https://n8npet.space/webhook/imap-listener";
  const payload = {
    userId: id,
    sender: senderEmail,
    subject,
    body,
  };
  sendToWebhook(webhookUrl, payload)
    .then((res) => console.log("Success:", res))
    .catch((err) => console.log(err));
}

async function sendToWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json().catch(() => null);

    return data;
  } catch (error) {
    console.error("Failed to send webhook:", error);
    return null;
  }
}

export const startListener = async () => {
  const imaps = await imapModel.find().populate("userId", "name email");

  for (const imap of imaps) {
    createListener(imap);
  }
};

// export const startListener = async () => {
//   const imaps = await imapModel.find().populate("userId", "name email");

//   for (const imap of imaps) {
//     createListener(imap);
//   }

//   async function createListener(imap) {
//     const client = new ImapFlow({
//       host: imap.imapHost,
//       port: imap.imapPort,
//       secure: true,
//       auth: {
//         user: imap.imapUser,
//         pass: imap.imapPass,
//       },
//     });

//     await client.connect();
//     await client.mailboxOpen("INBOX");

//     client.on("exists", async () => {
//       let lock = await client.getMailboxLock("INBOX");
//       try {
//         for await (let msg of client.fetch("*", {
//           envelope: true,
//           source: true,
//         })) {
//           processEmail(imap.userId.id, msg);
//         }
//       } finally {
//         lock.release();
//       }
//     });

//     client.on("error", (err) => {
//       console.log(err.message);
//     });
//   }

//   async function processEmail(id, msg) {
//     const parsed = await simpleParser(msg.source);
//     const sender = parsed.from.text;
//     const senderEmail = sender.match(/<([^>]+)>/)[1];
//     const subject = parsed.subject || "";
//     const body = parsed.text || "";
//     const webhookUrl = "https://n8npet.space/webhook/imap-listener";
//     const payload = {
//       userId: id,
//       sender: senderEmail,
//       subject,
//       body,
//     };
//     sendToWebhook(webhookUrl, payload)
//       .then((res) => console.log("Success:", res))
//       .catch((err) => console.log(err));
//   }

//   async function sendToWebhook(url, payload) {
//     try {
//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!response.ok) {
//         throw new Error(
//           `Webhook error: ${response.status} ${response.statusText}`
//         );
//       }

//       const data = await response.json().catch(() => null);

//       return data;
//     } catch (error) {
//       console.error("Failed to send webhook:", error);
//       return null;
//     }
//   }
// };
