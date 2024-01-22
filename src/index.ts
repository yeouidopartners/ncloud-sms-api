import axios from 'axios';
import crypto from 'crypto';

const NCLOUD_API_HOST = 'https://sens.apigw.ntruss.com';
const KOREA_PHONE_NUMBER_REGEX = /^(010|8210)\d{8}$/;

export class NCloudSmsApi {
  private _serviceId: string;
  private _secretKey: string;
  private _accessKey: string;
  private _callingNumber: string;

  constructor(credential: SmsApiCredential, callingNumber: string) {
    this._serviceId = credential.serviceId;
    this._secretKey = credential.secretKey;
    this._accessKey = credential.accessKey;
    this._callingNumber = callingNumber;
  }
  async requestMessage(receiver: string, content: string): Promise<MessageResult>;
  async requestMessage(req: MessageRequest): Promise<MessageResult>;

  async requestMessage(a: any, b?: any): Promise<MessageResult> {
    if (typeof a === 'string' && typeof b === 'string') {
      const receiver = a.replace(/[^0-9]/g, '');
      const content = b;

      if (!KOREA_PHONE_NUMBER_REGEX.test(receiver)) {
        throw new Error(`${receiver} is not a valid phone number format`);
      }

      const byteLength = Buffer.from(content).length;

      if (byteLength > 2000) {
        throw new Error('Message is too long. max byte length is 2000');
      }

      let result = await this._request({
        type: byteLength >= 90 ? 'LMS' : 'SMS',
        from: this._callingNumber,
        content,
        messages: [{ to: `${receiver}` }],
      });
      return result;
    }
    if (typeof a === 'object' && typeof b === 'undefined') {
      let result = await this._request(a);
      return result;
    }
    throw new Error('Invalid arguments');
  }

  private async _request(req: MessageRequest) {
    const sendAt = Date.now().toString();

    const path = `/sms/v2/services/${this._serviceId}/messages`;

    const hmac = crypto.createHmac('sha256', this._secretKey);

    hmac.update(`POST ${path}\n${sendAt}\n${this._accessKey}`);

    const signature = hmac.digest('base64');

    let res = await axios.post(`${NCLOUD_API_HOST}${path}`, req, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-iam-access-key': this._accessKey,
        'x-ncp-apigw-timestamp': sendAt,
        'x-ncp-apigw-signature-v2': signature,
      },
    });
    return res.data as MessageResult;
  }
}

interface MessageResult {
  requestId: string;
  requestTime: string;
  statusCode: string;
  statusName: string;
}

export interface SmsApiCredential {
  serviceId: string;
  secretKey: string;
  accessKey: string;
}

export interface MessageRequest {
  type: 'SMS' | 'LMS';
  contentType?: 'COMM' | 'AD';

  /**
   * @description 국가코드
   * @default 82
   */
  countryCode?: string;
  from: string;

  /**
   * @description 기본 메시지 제목
   */
  subject?: string;

  /**
   * @description 기본 메시지 내용
   */
  content: string;

  /**
   * @description 수신자 목록, 내용
   */
  messages: Message[];
}

interface Message {
  /**
   * @description 수신자 번호
   * @example 01012345678, 821012345678
   */
  to: string;

  /**
   * @description 개별 메시지 제목
   */
  subject?: string;

  /**
   * @description 개별 메시지 내용
   */
  content?: string;
}
