import axios from 'axios';
import { config } from './config';

export async function sendBirthdayMessage(fullName: string): Promise<void> {
  const message = `Hey, ${fullName} it's your birthday`;
  await axios.post(config.hookbinUrl, { message, fullName });
}

