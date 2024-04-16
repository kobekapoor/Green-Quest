import { render } from '@react-email/render'
import { createTransport } from 'nodemailer'
import SMTPPool from 'nodemailer/lib/smtp-pool'

type SendEmailProps = {
    to?: string
    bcc?: string[]
    subject: string
    component: any
}

export function createSMTPTransporter()
{
    const pool = new SMTPPool({
        pool: true,
        maxConnections: 5,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'sydneyharbourwitnessing@gmail.com',
            pass: process.env.EMAIL_PASSWORD,
        },        
        })
    const transporter = createTransport(pool, {
        from: '"Sydney Harbour Witnessing" <sydneyharbourwitnessing@gmail.com>'
    })

    return transporter
}

export async function sendSingleEmail({ to, bcc, subject, component }: SendEmailProps)
{
    const transporter = createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 'sydneyharbourwitnessing@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        }) 

    const html = render(component)

    const info = await transporter.sendMail({
        from: '"Sydney Harbour Witnessing" <sydneyharbourwitnessing@gmail.com>',
        to,
        bcc,
        subject,
        html,
    })

    return info
}