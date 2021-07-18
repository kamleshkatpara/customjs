import { json, urlencoded } from 'body-parser';
import { MetadataStorage } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import * as express from 'express';
import * as httpContext from 'express-http-context';
import * as helmet from 'helmet';
import 'reflect-metadata';
import { getFromContainer, getMetadataArgsStorage, useContainer, useExpressServer, Action, UnauthorizedError, RoutingControllersOptions } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { Container } from 'typedi';
import * as uuid from 'uuid';
import { Logger, LoggerService } from './common/logger';
import * as mongoose from 'mongoose';
import * as config from 'config';
import * as health from 'express-ping';

export class App {

    private app: express.Application;

    private routingControllersOptions(): RoutingControllersOptions {
        return {
            defaults: {
                // with this option, null will return 404 by default
                nullResultCode: 404,

                // with this option, void or Promise<void> will return 204 by default
                undefinedResultCode: 204,
            },
            defaultErrorHandler: false,
            classTransformer: true,
            validation: true,
            development: true,
            controllers: [__dirname + "/controllers/*{.js,.ts}"],
            routePrefix: '/api'
        };
    }

    constructor(@Logger(__filename) private logger: LoggerService = new LoggerService(__filename)) { }

    public async initApp(): Promise<void> {
        try {
            this.app = express();
            this.setupExpress();
            await this.setupRouting();
            this.initDatabase();
            this.setupSwagger();
        } catch (error) {
            this.logger.warn(`Something went wrong while initializing server, see log for details`);
            this.logger.error(error.stack);
            process.exit(1);
        }
    }

    private setupExpress(): void {
        this.logger.info('Setting up server...');
        this.app.use(json());
        this.app.use(urlencoded({
            extended: true
        }));
        this.app.use(helmet());
        this.app.use((req, res, next) => {
            res.setHeader('X-Powered-By', 'Custom');
            next();
        });
        this.app.use(httpContext.middleware);
        this.app.use((req, res, next) => {
            httpContext.set('reqId', uuid.v1());
            httpContext.set('useragent', req.headers['user-agent']);
            httpContext.set('ip', req.ip);
            next();
        });
        this.app.use(health.ping());
        process.on('uncaughtException', (error) => {
            this.logger.error(error.stack);
        });
    }

    private async setupRouting(): Promise<express.Application> {
        this.logger.info('Setting up routes...');
        useContainer(Container);
        this.app = useExpressServer(this.app, this.routingControllersOptions());
        this.logger.info('Routing setup successful');
        return this.app;
    }

    private initDatabase(): void {
        this.logger.info('Setting up database...');
        try {
            mongoose.connect(config.get('database.url'), { useNewUrlParser: true, useUnifiedTopology: true });
            this.logger.info('Database setup succesful');
        } catch (error) {
            this.logger.error(`Something went wrong while initializing database => ${error.message}`);
        }
    }

    private setupSwagger(): void {
        this.logger.info('Setting up swagger...');
        const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas
        const schemas = validationMetadatasToSchemas(metadatas, {
            refPointerPrefix: '#/components/schemas/'
        })

        const storage = getMetadataArgsStorage();
        const securityRequirement = {
            bearerAuth: [],
        };
        const spec = routingControllersToSpec(storage, this.routingControllersOptions(), {
            openapi: '3.0.0',
            components: {
                schemas,
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                }
            },
            info: {
                description: 'CustomJS API',
                title: 'CustomJS',
                version: '1.0.0',
            },
            servers: [
                {
                    url: '',
                    variables: {
                        protocol: {
                            enum: ['http', 'https'],
                            default: 'http',
                        },
                        environment: {
                            enum: [
                                'localhost:3000',
                                'dev.mydomain.com',
                                'test.mydomain.com',
                                'prod.mydomain.com'
                            ],
                            default: 'localhost:3000',
                        },
                        site: {
                            enum: ['', '/', '/API'],
                            default: '',
                        },
                        basePath: {
                            enum: [
                                '',
                                '/',
                                `${this.routingControllersOptions().routePrefix}`,
                            ],
                            default: '',
                        },
                    },
                },
            ],
            security: [securityRequirement],
        });
        this.logger.info('Swagger setup successful');
        console.log(spec);

        this.app.use('/explorer', swaggerUi.serve, swaggerUi.setup(spec));
    }

    public getAppInstance(): express.Application {
        return this.app;
    }
}