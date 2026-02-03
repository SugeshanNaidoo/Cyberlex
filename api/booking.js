import nodemailer from "nodemailer";

console.log("SMTP USER EXISTS:", !!process.env.SMTP_USER);
console.log("SMTP PASS LENGTH:", process.env.SMTP_PASS?.length);


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
    const { name, email, phone, company, service, date, time, message } =
      req.body;

    // Validation
    if (!name || !email || !phone || !service || !date || !time) {
      return res.status(400).json({
        error:
          "Missing required fields: name, email, phone, service, date, and time are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res
        .status(400)
        .json({ error: "Selected date must be in the future" });
    }

    const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      return res
        .status(400)
        .json({ error: "Invalid phone number format" });
    }

    // SMTP (Gmail SSL – REQUIRED)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },
    });

    // Optional but useful during testing
    await transporter.verify();

    const bookingRef = `CYB-${Date.now().toString().slice(-6)}`;

    const businessEmail = {
      from: `"Cyberlex Booking System" <${process.env.SMTP_USER}>`,
      to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
      subject: `New Appointment Booking: ${service} - ${bookingRef}`,
      html: `
        <h2>New Appointment Booking</h2>
        <p><strong>Reference:</strong> ${bookingRef}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <hr />
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Date:</strong> ${new Date(date).toLocaleDateString(
          "en-ZA"
        )}</p>
        <p><strong>Time:</strong> ${time}</p>
        ${
          message
            ? `<hr /><p><strong>Message:</strong><br/>${message}</p>`
            : ""
        }
      `,
    };

    const autoReply = {
      from: `"Cyberlex" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Appointment Request Received – ${bookingRef}`,
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for booking an appointment with Cyberlex.</p>
        <p><strong>Reference:</strong> ${bookingRef}</p>
        <p>We will confirm your appointment within 24 hours.</p>
        <br />
        <p>Regards,<br/>Cyberlex Team</p>
      `,
    };

    await transporter.sendMail(businessEmail);
    await transporter.sendMail(autoReply);

    return res.status(200).json({
      success: true,
      message:
        "Appointment booking submitted successfully. Check your email for confirmation.",
      bookingReference: bookingRef,
    });
  } catch (error) {
    console.error("Booking form error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process booking submission.",
    });
  }
}
