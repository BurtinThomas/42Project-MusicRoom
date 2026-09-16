"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const corsOrigins = config.get('corsOrigins') ?? [];
    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
        credentials: true,
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Music Room API')
        .setDescription('REST + WebSocket API for the Music Room mobile app. The mobile app is only a ' +
        '"remote control": this API is the single source of truth (subject V.3/V.4).')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = config.get('port') ?? 3000;
    await app.listen(port);
    console.log(`Music Room API listening on :${port} (docs at /docs)`);
}
bootstrap();
//# sourceMappingURL=main.js.map