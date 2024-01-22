import { NCloudSmsApi } from '../src';

const serviceId = process.env.SERVICE_ID!;
const secretKey = process.env.SECRET_KEY!;
const accessKey = process.env.ACCESS_KEY!;

const api = new NCloudSmsApi({ serviceId, secretKey, accessKey }, '16001234');

main();

async function main() {
  await api.requestMessage('01012345678', 'Hello World!');

  await api.requestMessage({
    content: 'Hello World!',
    from: '16001234',
    messages: [{ to: '01012345678' }],
    type: 'SMS',
  });
}
