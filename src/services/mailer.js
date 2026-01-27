const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

async function sendAlertEmail(subject, text) {
  const t = getTransporter();
  if (!t) return false;
  const from = process.env.ALERT_FROM || process.env.SMTP_USER;
  const to = process.env.ALERT_TO || process.env.SMTP_USER;
  if (!from || !to) return false;

  await t.sendMail({ from, to, subject, text });
  return true;
}

module.exports = { sendAlertEmail };


