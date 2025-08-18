declare module '@elasticemail/elasticemail-client' {
  export class ElasticEmail {
    constructor(apiKey: string);
    emails: {
      emailsTransactionalPost(data: any): Promise<any>;
    };
  }
}
