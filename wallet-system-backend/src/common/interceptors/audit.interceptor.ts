import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const body = request.body;

    if (user && body) {
      // CREATE
      if (!body.id && !body.createdBy) {
        body.createdBy = user.id;
      }

      // UPDATE
      if (body.id) {
        body.updatedBy = user.id;
      }
    }

    return next.handle();
  }
}
