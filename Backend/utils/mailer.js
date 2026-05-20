import dotenv from 'dotenv';
import { Resend } from 'resend';
dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendEmail = async ({ from, to, subject, html }) => {
    if (!resend) {
        console.warn(`[MAIL] Resend not configured. Email to ${to} skipped.`);
        return false;
    }

    if (!from) {
        console.warn('[MAIL] "from" not provided. Email skipped.');
        return false;
    }

    try {
        await resend.emails.send({
            from,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error(`[MAIL] Failed to send email to ${to} via Resend:`, error);
        return false;
    }
};