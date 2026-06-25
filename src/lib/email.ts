import nodemailer from 'nodemailer';

// Helper to create the SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendVerificationEmail = async (email: string, name: string, otp: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'ShopTantra'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your ShopTantra Seller Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1B3A6B; margin: 0;">ShopTantra</h1>
          </div>
          
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Thank you for registering as a seller on ShopTantra. To activate your account and access your dashboard, please verify your email address using the One-Time Password (OTP) below:
          </p>
          
          <div style="background-color: #f4f7fb; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1B3A6B;">${otp}</span>
          </div>
          
          <p style="color: #555; font-size: 14px; text-align: center;">
            This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            If you did not request this verification, please ignore this email.<br/>
            &copy; ${new Date().getFullYear()} ShopTantra. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    // If SMTP is not configured, we still return true in dev to not block registration, 
    // but log a loud warning. For production, you might want to return false if email fails.
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP credentials not found. Email delivery skipped.');
      return { success: true }; 
    }
    return { success: false, error };
  }
};
