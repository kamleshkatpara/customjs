import { App } from './app';
import { LoggerService, Logger } from './common/logger';
import { createServer, Server as HttpServer } from 'http';
import * as config from 'config';

interface NodeError {
    Error: any;
    errno: string;
    code: string;
    syscall: string;
    address: string;
    port: number;
}

class Server extends App {

    private port: number = parseInt(process.env.PORT) || config.get('server.port');
    private httpServer: HttpServer;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    constructor(@Logger(__filename) private Logger: LoggerService = new LoggerService(__filename)) {
        super();

        this.initApp();

        this.httpServer = createServer(this.getAppInstance());
        this.httpServer.listen(this.port, () => {
            const hostInfo = this.httpServer.address();
            const hostname = (hostInfo['address'] = '::') ? 'http://localhost' : hostInfo['address'];
            const hostport = hostInfo['port'];
            this.Logger.info(`Running environment: ${process.env.NODE_ENV}`);
            this.Logger.info(`Server is running on : ${hostname}:${hostport}`);
            this.Logger.info(`Swagger is running on: ${hostname}:${hostport}/explorer`);
        });
        this.httpServer.on('error', (error: any) => this.handleErrors(error));
    }

    private handleErrors(error: NodeError): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        switch (error.code) {
            case 'EACCES':
                this.Logger.error(`⚠ Server requires elevated privileges to run (using port: ${error.port})`, error);
                break;
            case 'EADDRINUSE':
                this.Logger.error(`⚠ Port (${error.port}) already in use`, error);
                break;
            default:
                throw error;
        }
        process.exit(1);
    }
}

export default new Server();