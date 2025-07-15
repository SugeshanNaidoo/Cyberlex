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
        const { name, email, phone, company, service, date, time, message } = req.body;

        // Basic validation
        if (!name || !email || !phone || !service || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, phone, service, date, and time are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email address' 
            });
        }

        // Date validation (must be future date)
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({ 
                error: 'Selected date must be in the future' 
            });
        }

        // Phone validation
        const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ 
                error: 'Invalid phone number format' 
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // Your email
                pass: process.env.SMTP_PASS, // Your email password or app password
            },
        });

        // Generate a booking reference
        const bookingRef = `CYB-${Date.now().toString().slice(-6)}`;

        // Email to business owner
        const businessEmail = {
            from: `"Cyberlex Booking System" <${process.env.SMTP_USER}>`,
            to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
            subject: `New Appointment Booking: ${service} - ${bookingRef}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #2E57D1, #4A90E2); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                        <h2 style="margin: 0; font-size: 24px;">New Appointment Booking</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Booking Reference: ${bookingRef}</p>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Client Information</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #2E57D1;">${email}</a></p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${company || 'Not provided'}</p>
                    </div>
                    
                    <div style="background: #e8f0fe; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Appointment Details</h3>
                        <p style="margin: 5px 0;"><strong>Service:</strong> ${service}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-ZA')}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
                    </div>
                    
                    ${message ? `
                    <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 20px;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Additional Information</h3>
                        <p style="line-height: 1.6; color: #374151; white-space: pre-wrap;">${message}</p>
                    </div>
                    ` : ''}
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #92400e; margin: 0 0 10px 0;">Action Required</h3>
                        <p style="color: #92400e; margin: 0;">Please confirm this appointment within 24 hours by contacting the client directly.</p>
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
            subject: `Appointment Request Received - ${bookingRef}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #2E57D1, #4A90E2); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                        <h2 style="margin: 0; font-size: 24px;">Appointment Request Received!</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Reference: ${bookingRef}</p>
                    </div>
                    
                    <p>Dear ${name},</p>
                    
                    <p>Thank you for booking an appointment with Cyberlex. We have received your request and will confirm your appointment within 24 hours.</p>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">Your Appointment Details</h3>
                        <p style="margin: 5px 0;"><strong>Service:</strong> ${service}</p>
                        <p style="margin: 5px 0;"><strong>Requested Date:</strong> ${new Date(date).toLocaleDateString('en-ZA')}</p>
                        <p style="margin: 5px 0;"><strong>Requested Time:</strong> ${time}</p>
                        <p style="margin: 5px 0;"><strong>Reference:</strong> ${bookingRef}</p>
                    </div>
                    
                    <div style="background: #e8f0fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="color: #2E57D1; margin: 0 0 10px 0;">What happens next?</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #374151;">
                            <li>Our team will review your appointment request</li>
                            <li>We'll confirm availability and send you a calendar invite</li>
                            <li>You'll receive meeting details (video call or in-person)</li>
                            <li>We'll prepare for your consultation based on your requirements</li>
                        </ul>
                    </div>
                    
                    <p>If you need to make any changes or have questions, please contact us directly:</p>
                    
                    <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📧 Email:</strong> info@cyberlex.co.za</p>
                        <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +27 11 234 5678</p>
                        <p style="margin: 5px 0;"><strong>🏢 Address:</strong> 123 Legal District, Sandton, Johannesburg</p>
                    </div>
                    
                    <p>We look forward to speaking with you soon!</p>
                    
                    <p>Best regards,<br>
                    <strong>The Cyberlex Team</strong><br>
                    <em>Leading Tech Law & Compliance Advisory</em></p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center;">
                        <p>This is an automated response. Please do not reply to this email.</p>
                        <p>Please save this email for your records.</p>
                    </div>
                </div>
            `
        };

        // Send emails
        await transporter.sendMail(businessEmail);
        await transporter.sendMail(autoReply);

        // Log successful submission
        console.log('Booking Form Submission:', {
            name,
            email,
            phone,
            company: company || 'Not provided',
            service,
            date,
            time,
            message: message || 'No additional information',
            bookingReference: bookingRef,
            timestamp: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            status: 'Emails sent successfully'
        });

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Appointment booking submitted successfully. Check your email for confirmation.',
            data: {
                bookingReference: bookingRef,
                name,
                email,
                service,
                date,
                time,
                submittedAt: new Date().toISOString(),
                status: 'pending_confirmation'
            }
        });

    } catch (error) {
        console.error('Booking form error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process booking submission. Please try again or contact us directly.'
        });
    }
}