import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot({
            // Use wildcard for flexible event matching
            wildcard: true,
            // Delimiter for namespaced events
            delimiter: '.',
            // Max listeners per event
            maxListeners: 10,
            // Verbose logging in dev
            verboseMemoryLeak: process.env.NODE_ENV !== 'production',
        }),
    ],
    exports: [EventEmitterModule],
})
export class EventsModule { }
