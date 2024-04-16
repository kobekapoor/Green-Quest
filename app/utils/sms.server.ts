import { fetch } from '@remix-run/node'


export const sendSMS = async (sms: {message: string, to: string[], from?: string}): Promise<{status: number, statusText: string}> => {
    const result = await fetch('https://cellcast.com.au/api/v3/send-sms', {
    method: 'POST',
    headers: {
      APPKEY: 'CELLCAST5dd3c42d16f63c0fa746303bcaf6e6b9',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sms_text: sms.message,
      numbers: sms.to,
      from: sms.from,
    }),
  })

  return {
    status: result.status,
    statusText: result.statusText,
  }
}