import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, and message are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email address' 
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({

            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // Your email
                pass: process.env.SMTP_PASS, // Your email password or app password
            },
        });

        // Email to business owner
        const businessEmail = {
            from: `"Cyberlex Contact Form" <${process.env.SMTP_USER}>`,
            to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
            subject: `New Contact Form Submission: ${subject || 'General Inquiry'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #2E57D1, #4A90E2); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                        <h2 style="margin: 0; font-size: 24px;">New Contact Form Submission</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Cyberlex Website</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Contact Information</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2E57D1;">${email}</a></p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                    </div>
                    
                    <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Message</h3>
                        <p style="line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                        <p>Submitted on: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
                        <p>IP Address: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}</p>
                    </div>
                </div>
            `
        };

        // Auto-reply email to customer
        const autoReply = {
            from: `"Cyberlex" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Thank you for contacting Cyberlex - We\'ll be in touch soon!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #2E57D1, #4A90E2); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                        <h2 style="margin: 0; font-size: 24px;">Thank You for Contacting Us!</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Cyberlex - Tech Law Experts</p>
                    </div>
                    
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for reaching out to Cyberlex. We have received your message and appreciate your interest in our tech law services.</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">What happens next?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #374151;">
                            <li>Our team will review your inquiry within 24 hours</li>
                            <li>We'll respond with relevant information and next steps</li>
                            <li>If needed, we'll schedule a consultation to discuss your needs</li>
                        </ul>
                    </div>
                    
                    <p>In the meantime, feel free to explore our services or contact us directly:</p>
                    
                    <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📧 Email:</strong> info@cyberlex.co.za</p>
                        <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +27 11 234 5678</p>
                        <p style="margin: 5px 0;"><strong>🏢 Address:</strong> 123 Legal District, Sandton, Johannesburg</p>
                    </div>
                    
                    <p>Best regards,<br>
                    <strong>The Cyberlex Team</strong><br>
                    <em>Leading Tech Law & Compliance Advisory</em></p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
                        <p>This is an automated response. Please do not reply to this email.</p>
                    </div>
                </div>
            `
        };

        // Send emails
        await transporter.sendMail(businessEmail);
        await transporter.sendMail(autoReply);

        // Log successful submission
        console.log('Contact Form Submission:', {
            name,
            email,
            phone: phone || 'Not provided',
            subject: subject || 'General Inquiry',
            timestamp: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            status: 'Email sent successfully'
        });

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully. Check your email for confirmation.',
            data: {
                name,
                email,
                submittedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Contact form error:', error);
        
        // Send error response
        res.status(500).json({
            error: 'Failed to send message',
            message: 'There was an error processing your request. Please try again or contact us directly.'
        });
    }
}