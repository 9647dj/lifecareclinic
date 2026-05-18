import { Resend } from 'resend';
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);
export default resend;
