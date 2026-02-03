import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // SMTP (Gmail SSL – REQUIRED)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    const businessEmail = {
      from: `"Cyberlex Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
      subject: `New Contact Submission: ${subject || "General Inquiry"}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Subject:</strong> ${subject || "General Inquiry"}</p>
        <hr />
        <p>${message}</p>
      `,
    };

    const autoReply = {
      from: `"Cyberlex" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for contacting Cyberlex",
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for contacting Cyberlex. We’ve received your message and will respond shortly.</p>
        <br />
        <p>Regards,<br/>Cyberlex Team</p>
      `,
    };

    await transporter.sendMail(businessEmail);
    await transporter.sendMail(autoReply);

    return res.status(200).json({
      success: true,
      message: "Contact form submitted successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      error: "Failed to send message",
    });
  }
}
