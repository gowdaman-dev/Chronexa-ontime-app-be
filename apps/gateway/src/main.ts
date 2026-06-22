import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ConsoleLogger,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import compression from 'compression';
import helmet from 'helmet';
import { AppLoggerService } from '@app/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: new ConsoleLogger('APIGateway', {
      colors: true,
      timestamp: true,
      compact: true,
      prefix: 'APIGateway',
    }),
  });
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Authorization', 'X-Request-ID', 'X-Correlation-ID'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });
  const config = new DocumentBuilder()
    .setTitle('Chronexa Mobile API Gateway')
    .setDescription('API Gateway for Chronexa Mobile application')
    .addTag('Authentication', 'Login, logout, and token management')
    .addTag('User Management', 'User accounts and security')
    .addTag('Employee Management', 'Employee master data')
    .addTag('Mobile', 'Mobile check-in, location, and IDS punch')
    .addTag('Employee Leave', 'Leave requests and approvals')
    .addTag('Short Permission', 'Short permission requests and approvals')
    .addTag('Missing Movement', 'Missing movement records')
    .addTag('Manual Transaction', 'Manual movement transactions')
    .addTag('Leave Types', 'Leave type master data')
    .addTag('Permission Types', 'Permission type master data')
    .addTag('Holidays', 'Holiday calendar')
    .addTag('Event Transactions', 'Punch and event transactions')
    .addTag('Reports', 'Daily, weekly, and monthly attendance reports')
    .addSecurity('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
    })
    .addSecurity('cookiesAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: 'connect.sid',
    })
    .setTermsOfService('https://chronexa.ai/terms-of-service')
    .setContact(
      'Chronexa Support',
      'https://chronexa.ai/terms-conditions/',
      'support@chronexa.ai',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
          ],
          'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        },
      },
    }),
  );
  app.useGlobalPipes(new ValidationPipe());
  const appLogger = app.get(AppLoggerService);
  app.useGlobalFilters(new RpcExceptionFilter(appLogger));

  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'mars',
      favicon:
        'https://chronexa.ai/wp-content/uploads/2026/02/logo-icon-red.png',
      hideClientButton: true,
      showDeveloperTools: 'never',
      authentication: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
          cookiesAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'connect.sid',
          },
        },
      },
      pageTitle: 'Chronexa Mobile API Reference',
      mcp: {
        name: 'Chronexa Mobile API Reference',
        url: '/mcp/openapi.json',
      },
      persistAuth: true,
      servers: [
         {
          url: `http://160.25.62.34:${process.env.PORT || 3000}`,
          description: 'Local Development Server',
        },
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
          description: 'Local Development Server',
        },
      ],
    }),
  );
  await app.listen(process.env.PORT || 3000);
  Logger.verbose(
    `API Gateway is running on port http://localhost:${process.env.PORT || 3000}`,
  );
  Logger.verbose(
    `API documentation available at http://localhost:${process.env.PORT || 3000}/docs`,
  );
}
bootstrap();
