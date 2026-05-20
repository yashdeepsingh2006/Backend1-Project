import dotenv from 'dotenv';
import { Resend } from 'resend';
dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const buildHtml = (firstName, otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem; border: 1px solid #ebebeb; border-radius: 12px;">
        <h2 style="color: #222; margin-bottom: 0.5rem;">Welcome to Hotspot, ${firstName}!</h2>
        <p style="color: #555; margin-bottom: 1.5rem;">Use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="background-color: #fff5f5; border: 1px solid #ffd5d5; border-radius: 8px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
            <p style="font-size: 2rem; font-weight: 700; color: #fe424d; letter-spacing: 0.5rem; margin: 0;">${otp}</p>
        </div>
        <p style="color: #888; font-size: 0.85rem;">If you did not create an account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ebebeb; margin: 1.5rem 0;">
        <p style="color: #888; font-size: 0.8rem; margin: 0;">© Hotspot Private Limited</p>
    </div>
`;

export const sendOTPEmail = async (email, otp, firstName) => {
    if (!resend) {
        console.warn(`[OTP] Resend not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    const from = process.env.RESEND_FROM;

    if (!from) {
        console.warn(`[OTP] RESEND_FROM not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await resend.emails.send({
            from,
            to: email,
            subject: 'Verify your Hotspot account',
            html: buildHtml(firstName, otp),
        });

        return true;
    } catch (error) {
        console.error(`[OTP] Failed to send OTP email to ${email} via Resend:`, error);
        console.warn(`[OTP] Fallback OTP for ${email}: ${otp}`);
        return false;
    }
};